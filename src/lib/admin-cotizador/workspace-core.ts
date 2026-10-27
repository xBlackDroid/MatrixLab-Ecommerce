import type { WorkspaceSnapshot } from "@/lib/admin-cotizador/schema";

/**
 * Lógica de guardado con concurrencia OPTIMISTA del cotizador admin.
 *
 * Separada del cliente Supabase (ver workspace-store.ts) para poder probar
 * las carreras con un repositorio en memoria (scripts/qa/admin-cotizador-workspace.test.ts).
 *
 * Regla: nunca "gana el último". Un guardado sólo prospera si el cliente
 * partió de la versión que hay en la base; si no, 409 y el cliente decide.
 */

export interface WorkspaceRecord {
  version: number;
  /** Foto guardada, o null si todavía no se ha guardado nada (versión 0). */
  snapshot: unknown;
  updatedAt: string | null;
}

export interface WorkspaceWrite {
  version: number;
  snapshot: WorkspaceSnapshot;
  updatedBy: string;
}

export interface WorkspaceRepo {
  read(): Promise<WorkspaceRecord | null>;
  /**
   * UPDATE atómico condicionado: sólo escribe si la versión actual es
   * `expectedVersion`. Devuelve la fila nueva, o null si no coincidió.
   */
  updateIfVersion(
    expectedVersion: number,
    next: WorkspaceWrite,
  ): Promise<WorkspaceRecord | null>;
  /** Crea la fila singleton. "conflict" si ya existía (otra petición ganó). */
  insertInitial(next: WorkspaceWrite): Promise<WorkspaceRecord | "conflict">;
}

export type SaveOutcome =
  | { status: "saved"; record: WorkspaceRecord }
  | { status: "conflict"; current: WorkspaceRecord | null };

/** Normaliza la lectura: versión 0 = "nada guardado" aunque exista la fila. */
export async function loadWorkspace(
  repo: WorkspaceRepo,
): Promise<WorkspaceRecord> {
  const record = await repo.read();
  if (!record || record.version === 0) {
    return { version: record?.version ?? 0, snapshot: null, updatedAt: null };
  }
  return record;
}

export async function saveWorkspace(
  repo: WorkspaceRepo,
  baseVersion: number,
  snapshot: WorkspaceSnapshot,
  updatedBy: string,
): Promise<SaveOutcome> {
  const next: WorkspaceWrite = { version: baseVersion + 1, snapshot, updatedBy };

  const updated = await repo.updateIfVersion(baseVersion, next);
  if (updated) return { status: "saved", record: updated };

  // No coincidió: o alguien guardó antes, o la fila singleton no existe
  // (base recién creada sin la fila semilla de la migración).
  const current = await repo.read();
  if (!current && baseVersion === 0) {
    const inserted = await repo.insertInitial(next);
    if (inserted !== "conflict") return { status: "saved", record: inserted };
    return { status: "conflict", current: await repo.read() };
  }
  return { status: "conflict", current };
}

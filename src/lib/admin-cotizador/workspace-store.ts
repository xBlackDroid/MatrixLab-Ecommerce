import "server-only";

import { requireServiceClient } from "@/lib/db/admin";
import type {
  WorkspaceRecord,
  WorkspaceRepo,
  WorkspaceWrite,
} from "@/lib/admin-cotizador/workspace-core";

/**
 * Repositorio Supabase de la foto del cotizador. Usa el cliente SERVICE ROLE
 * (la tabla tiene RLS sin policies y sin grants a anon/authenticated), así
 * que sólo puede llamarse desde handlers que ya validaron la sesión admin.
 */

const TABLE = "admin_quote_workspace";
const ROW_ID = "default";

type Row = { version: number; snapshot: unknown; updated_at: string | null };

function toRecord(row: Row): WorkspaceRecord {
  return {
    version: row.version,
    snapshot: row.snapshot,
    updatedAt: row.updated_at,
  };
}

export function createWorkspaceRepo(): WorkspaceRepo {
  const client = requireServiceClient();

  return {
    async read() {
      const { data, error } = await client
        .from(TABLE)
        .select("version, snapshot, updated_at")
        .eq("id", ROW_ID)
        .maybeSingle();
      if (error) throw new Error("WORKSPACE_READ_FAILED");
      return data ? toRecord(data as Row) : null;
    },

    async updateIfVersion(expectedVersion: number, next: WorkspaceWrite) {
      // Un solo UPDATE con la versión en el WHERE: atómico en Postgres.
      const { data, error } = await client
        .from(TABLE)
        .update({
          version: next.version,
          snapshot: next.snapshot,
          updated_by: next.updatedBy,
        })
        .eq("id", ROW_ID)
        .eq("version", expectedVersion)
        .select("version, snapshot, updated_at");
      if (error) throw new Error("WORKSPACE_WRITE_FAILED");
      const rows = (data ?? []) as Row[];
      return rows[0] ? toRecord(rows[0]) : null;
    },

    async insertInitial(next: WorkspaceWrite) {
      const { data, error } = await client
        .from(TABLE)
        .insert({
          id: ROW_ID,
          version: next.version,
          snapshot: next.snapshot,
          updated_by: next.updatedBy,
        })
        .select("version, snapshot, updated_at")
        .single();
      // 23505 = unique_violation: otra petición creó la fila primero.
      if (error?.code === "23505") return "conflict";
      if (error || !data) throw new Error("WORKSPACE_WRITE_FAILED");
      return toRecord(data as Row);
    },
  };
}

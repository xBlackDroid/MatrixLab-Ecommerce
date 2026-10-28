import { createHash } from "node:crypto";
import { z } from "zod";
import { QuoteFieldsSchema, SavedLineSchema } from "@/lib/admin-cotizador/schema";

/**
 * Folios consecutivos de cotización (COT-xxx), asignados SÓLO por el servidor.
 *
 * El navegador pide un rango al generar el PDF (POST /api/admin/cotizador/folios)
 * con un UUID de idempotencia y el contenido de la cotización. El servidor
 * calcula cuántos folios hacen falta (1 si es integrada o de una sola línea;
 * uno por línea si es individual, como el original) y una huella SHA-256 del
 * contenido normalizado. La base (ver supabase/migrations/*_admin_quote_folios.sql)
 * reserva el rango de forma atómica:
 *   - mismo UUID + mismo contenido → el mismo rango (reintento sin consumir);
 *   - mismo UUID + otro contenido  → conflicto (nunca se comparte un folio);
 *   - UUID nuevo                   → folios nuevos, contiguos.
 *
 * El contenido sólo sirve para la huella: no se guarda ni se registra.
 * Sin `server-only`: lo importan los tests de QA directamente.
 */

export const FOLIO_PREFIX = "COT-";
/** Última cotización emitida antes de la numeración en servidor. */
export const FOLIO_SEED_LAST_ISSUED = 38;
export const MAX_FOLIOS_PER_REQUEST = 200;
export const MAX_FOLIO = 999_999_999;

export function formatFolio(n: number): string {
  return FOLIO_PREFIX + String(n).padStart(3, "0");
}

export const FOLIO_MODES = ["integrated", "individual"] as const;
export type FolioMode = (typeof FOLIO_MODES)[number];

export const FolioReserveRequestSchema = z
  .object({
    requestId: z.uuid(),
    mode: z.enum(FOLIO_MODES),
    quote: z
      .object({
        iva: z.boolean(),
        lines: z.array(SavedLineSchema).min(1).max(MAX_FOLIOS_PER_REQUEST),
        fields: QuoteFieldsSchema,
      })
      .strict(),
  })
  .strict();

export type FolioReserveRequest = z.infer<typeof FolioReserveRequestSchema>;

export type ParsedFolioRequest =
  | { ok: true; request: FolioReserveRequest; count: number; fingerprint: string }
  | { ok: false };

/** Folios que consume una generación: igual que el `generatePDF` original. */
export function folioCount(mode: FolioMode, lineCount: number): number {
  return mode === "integrated" || lineCount === 1 ? 1 : lineCount;
}

/** JSON con llaves ordenadas: la huella no depende del orden de las llaves. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

/** SHA-256 (hex) del contenido normalizado de la cotización, sin el UUID. */
export function quoteFingerprint(request: FolioReserveRequest, count: number): string {
  const normalized = canonicalJson({ v: 1, mode: request.mode, count, quote: request.quote });
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function parseFolioReserve(body: unknown): ParsedFolioRequest {
  const parsed = FolioReserveRequestSchema.safeParse(body);
  if (!parsed.success) return { ok: false };
  const count = folioCount(parsed.data.mode, parsed.data.quote.lines.length);
  return { ok: true, request: parsed.data, count, fingerprint: quoteFingerprint(parsed.data, count) };
}

export interface FolioReservation {
  first: number;
  count: number;
  /** Último folio emitido en todo el sistema tras esta operación. */
  lastIssued: number;
  /** true = la misma solicitud ya se había atendido (no consumió folios). */
  replayed: boolean;
}

export interface FolioRepo {
  /** Último folio emitido (sin reservar nada). */
  lastIssued(): Promise<number>;
  /** Reserva atómica; "conflict" si el UUID ya se usó con otro contenido. */
  reserve(input: {
    requestId: string;
    count: number;
    fingerprint: string;
  }): Promise<FolioReservation | "conflict">;
}

export type FolioOutcome =
  | { status: "reserved"; reservation: FolioReservation; folios: string[]; next: number }
  | { status: "conflict" };

export async function reserveFolios(
  repo: FolioRepo,
  parsed: Extract<ParsedFolioRequest, { ok: true }>,
): Promise<FolioOutcome> {
  const result = await repo.reserve({
    requestId: parsed.request.requestId,
    count: parsed.count,
    fingerprint: parsed.fingerprint,
  });
  if (result === "conflict") return { status: "conflict" };
  // Defensa: lo que vuelve de la base debe cuadrar con lo pedido.
  if (
    result.count !== parsed.count ||
    !Number.isInteger(result.first) ||
    result.first <= FOLIO_SEED_LAST_ISSUED ||
    result.first + result.count - 1 > result.lastIssued
  ) {
    throw new Error("FOLIO_RESERVATION_MISMATCH");
  }
  const folios = Array.from({ length: result.count }, (_, i) => formatFolio(result.first + i));
  return { status: "reserved", reservation: result, folios, next: result.lastIssued + 1 };
}

/** Forma validada de la respuesta jsonb de la función SQL. */
export const FolioRpcResultSchema = z
  .object({
    first: z.number().int().min(FOLIO_SEED_LAST_ISSUED + 1).max(MAX_FOLIO),
    count: z.number().int().min(1).max(MAX_FOLIOS_PER_REQUEST),
    last_issued: z.number().int().min(FOLIO_SEED_LAST_ISSUED).max(MAX_FOLIO),
    replayed: z.boolean(),
  })
  .strict();

import { z } from "zod";

/**
 * Contrato de la "foto" del cotizador admin que se guarda en la nube
 * (tabla `admin_quote_workspace`, ver supabase/migrations/*_admin_quote_workspace.sql).
 *
 * La foto la arma `legacy/adapter.js` en el navegador. El servidor NO confía
 * en ella: valida forma, tipos, rangos numéricos y longitudes de texto, y
 * rechaza llaves desconocidas (`.strict()`), así que no se puede usar la
 * tabla como almacén arbitrario de JSON.
 *
 * Sin `server-only`: lo importan los tests de QA directamente.
 */

/** Tope de la foto serializada (UTF-8). La fila tiene además un CHECK en BD. */
export const MAX_SNAPSHOT_BYTES = 200 * 1024;

export const WORKSPACE_SCHEMA_VERSION = 1;

export const COTIZADOR_PAGES = [
  "dulceros",
  "tattoo",
  "tshirt",
  "caplab",
  "prendas",
  "stickers",
  "imanes",
  "accesorios",
  "fablab",
  "cotizacion",
  "recibos",
  "insumos",
] as const;

const PAY_METHODS = ["efectivo", "transferencia", "mp_pos", "mp_link"] as const;
const PAY_STATUSES = ["pagado", "anticipo", "liquidacion", "parcial"] as const;

// Zod 4: z.number() ya rechaza NaN e ±Infinity.
const text = (max: number) => z.string().max(max);
/**
 * Precio unitario de una línea. El original no impide montos negativos (una
 * línea manual de descuento es un uso válido), así que se aceptan acotados.
 */
const money = z.number().min(-100_000_000).max(100_000_000);
/** El original fuerza `Math.max(1, parseInt(…))`: nunca menos de 1. */
const quantity = z.number().int().min(1).max(1_000_000_000);
const folio = z.number().int().min(1).max(1_000_000_000);
/** Valor de un <input type="date">: vacío o AAAA-MM-DD. */
const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);
/** Valor crudo de un <input type="number">: vacío o número decimal simple. */
const numericInput = z.string().regex(/^(-?\d{1,9}(\.\d{1,6})?)?$/);

/** Ids de elementos del markup legado: minúsculas, dígitos y guiones. */
const domId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);

function boundedRecord<V extends z.ZodType>(
  key: z.ZodType<string>,
  value: V,
  maxEntries: number,
) {
  return z
    .record(key, value)
    .refine((record) => Object.keys(record).length <= maxEntries, {
      message: `máximo ${maxEntries} entradas`,
    });
}

const QuoteLineSchema = z
  .object({
    id: z.number().min(0).max(Number.MAX_SAFE_INTEGER),
    desc: text(600),
    qty: quantity,
    unitPrice: money,
  })
  .strict();

export const SavedLineSchema = z
  .object({ desc: text(600), qty: quantity, unitPrice: money })
  .strict();

const SavedQuoteSchema = z
  .object({
    cotNum: text(40),
    fecha: text(20),
    cliente: text(200),
    tel: text(120),
    lugar: text(300),
    tipo: text(200),
    iva: z.boolean(),
    lines: z.array(SavedLineSchema).max(200),
  })
  .strict();

export const QuoteFieldsSchema = z
  .object({
    cliente: text(200),
    tel: text(120),
    fechaEvento: isoDate,
    lugar: text(300),
    tipo: text(200),
    vigencia: text(60),
    notas: text(4000),
  })
  .strict();

const QuoteSchema = z
  .object({
    /**
     * Folio de referencia de la cotización en pantalla. Sólo informativo: el
     * folio definitivo lo asigna el servidor al generar el PDF (ver folios.ts).
     */
    num: folio,
    /** Siguiente folio tras el último PDF generado (o null si nunca). */
    nextNum: folio.nullable(),
    iva: z.boolean(),
    lines: z.array(QuoteLineSchema).max(200),
    fields: QuoteFieldsSchema,
  })
  .strict();

const ReceiptSchema = z
  .object({
    num: folio,
    iva: z.boolean(),
    payMethod: z.enum(PAY_METHODS),
    status: z.enum(PAY_STATUSES),
    lines: z.array(QuoteLineSchema).max(200),
    /** Sólo nombre y tamaño del comprobante: el archivo nunca se sube. */
    attachment: z
      .object({ name: text(200), size: z.number().int().min(0).max(10_000_000) })
      .strict()
      .nullable(),
    fields: z
      .object({
        cotRef: text(40),
        cliente: text(200),
        tel: text(120),
        fechaPago: isoDate,
        lugar: text(300),
        tipo: text(200),
        payRef: text(120),
        notas: text(4000),
      })
      .strict(),
  })
  .strict();

const ModulesSchema = z
  .object({
    /** Valores de inputs de los módulos (number/range/text → string; checkbox → boolean). */
    inputs: boundedRecord(domId, z.union([z.boolean(), text(200)]), 250),
    /** Índice del chip activo por grupo (`g<N>` = N-ésimo .chip-group). */
    chips: boundedRecord(
      z.string().regex(/^g\d{1,3}$/),
      z.number().int().min(0).max(50),
      150,
    ),
    /**
     * Índice de la sub-pestaña activa por página (sólo las que tienen).
     * partialRecord: en Zod 4 un record con llave enum exige TODAS las llaves.
     */
    subTabs: z.partialRecord(
      z.enum(COTIZADOR_PAGES),
      z.number().int().min(0).max(10),
    ),
    /** Contadores que el original guarda en variables, no en inputs. */
    counters: z
      .object({
        qtyD: z.number().int().min(10).max(1_000_000),
        tsCustomQty: z.number().int().min(5).max(1_000_000),
        pQty: z.number().int().min(1).max(1_000_000),
      })
      .strict(),
  })
  .strict();

export const WorkspaceSnapshotSchema = z
  .object({
    schema: z.literal(WORKSPACE_SCHEMA_VERSION),
    activePage: z.enum(COTIZADOR_PAGES),
    cot: QuoteSchema,
    rec: ReceiptSchema,
    savedCots: z.array(SavedQuoteSchema).max(50),
    /** Costos de la pestaña Insumos, por id de input (`c-…`). */
    costs: boundedRecord(z.string().regex(/^c-[a-z0-9-]{1,60}$/), numericInput, 150),
    modules: ModulesSchema,
  })
  .strict();

export type WorkspaceSnapshot = z.infer<typeof WorkspaceSnapshotSchema>;

export const WorkspaceSaveRequestSchema = z
  .object({
    baseVersion: z.number().int().min(0).max(2_000_000_000),
    snapshot: z.unknown(),
  })
  .strict();

export type ParsedSave =
  | { ok: true; baseVersion: number; snapshot: WorkspaceSnapshot }
  | { ok: false; reason: "invalid" | "too_large" };

export function snapshotByteLength(snapshot: unknown): number {
  return new TextEncoder().encode(JSON.stringify(snapshot)).length;
}

/** Valida el cuerpo de un PUT: versión base + foto completa y acotada. */
export function parseWorkspaceSave(body: unknown): ParsedSave {
  const envelope = WorkspaceSaveRequestSchema.safeParse(body);
  if (!envelope.success) return { ok: false, reason: "invalid" };
  if (snapshotByteLength(envelope.data.snapshot) > MAX_SNAPSHOT_BYTES) {
    return { ok: false, reason: "too_large" };
  }
  const snapshot = WorkspaceSnapshotSchema.safeParse(envelope.data.snapshot);
  if (!snapshot.success) return { ok: false, reason: "invalid" };
  return {
    ok: true,
    baseVersion: envelope.data.baseVersion,
    snapshot: snapshot.data,
  };
}

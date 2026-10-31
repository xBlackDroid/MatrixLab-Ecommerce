import { z } from "zod";

const cents = z.number().int().min(0).max(100_000_000);
const quantity = z.number().int().min(1).max(100_000);
export const dateSchema = z.iso.date().refine(v => v >= "2020-01-01" && v <= "2100-12-31");
export const commandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("item"), name: z.string().trim().min(1).max(120), sku: z.string().trim().max(60), priceCents: cents, quantity }),
  z.object({ kind: z.literal("stock"), itemId: z.uuid(), quantity }),
  z.object({ kind: z.literal("sale"), method: z.enum(["efectivo", "transferencia", "tarjeta"]), notes: z.string().trim().max(300), lines: z.array(z.object({ itemId: z.uuid(), quantity, priceCents: cents })).min(1).max(100) }),
  z.object({ kind: z.literal("void"), saleId: z.uuid(), reason: z.string().trim().min(3).max(200) }),
]);
export const envelopeSchema = z.object({ date: dateSchema, requestId: z.uuid(), command: commandSchema });
export type Command = z.infer<typeof commandSchema>;
export type Item = { id: string; name: string; sku: string; priceCents: number; brought: number; stock: number };
export type Sale = { id: string; createdAt: string; method: "efectivo" | "transferencia" | "tarjeta"; notes: string; lines: { itemId: string; name: string; quantity: number; priceCents: number }[]; totalCents: number; voidReason?: string };
export type Bazar = { items: Item[]; sales: Sale[]; requests: Record<string, string> };
export const emptyBazar = (): Bazar => ({ items: [], sales: [], requests: {} });
export const money = (cents: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(cents / 100);
export function mexicoDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
export function pesos(value: string) { if (!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error("Escribe el precio en pesos, con máximo dos decimales."); return Math.round(Number(value) * 100); }

// Pure transition; the API commits the complete document with a version predicate.
export function applyCommand(state: Bazar, requestId: string, command: Command, now: string): Bazar {
  const signature = JSON.stringify(command);
  if (Object.hasOwn(state.requests, requestId)) {
    if (state.requests[requestId] !== signature) throw new Error("La confirmación pertenece a otra operación.");
    return state;
  }
  const next = structuredClone(state);
  if (command.kind === "item") {
    if (next.items.length >= 1000) throw new Error("Se alcanzó el límite de piezas del bazar.");
    if (command.sku && next.items.some(i => i.sku.toLowerCase() === command.sku.toLowerCase())) throw new Error("Ese código ya existe. Usa Agregar stock para reponer piezas.");
    next.items.push({ id: requestId, name: command.name, sku: command.sku, priceCents: command.priceCents, brought: command.quantity, stock: command.quantity });
  } else if (command.kind === "stock") {
    const item = next.items.find(i => i.id === command.itemId);
    if (!item) throw new Error("No encontramos la pieza.");
    if (item.brought + command.quantity > 100_000) throw new Error("La cantidad excede el límite.");
    item.brought += command.quantity; item.stock += command.quantity;
  } else if (command.kind === "sale") {
    if (new Set(command.lines.map(l => l.itemId)).size !== command.lines.length) throw new Error("Una pieza aparece dos veces en la venta.");
    const lines = command.lines.map(line => {
      const item = next.items.find(i => i.id === line.itemId);
      if (!item || item.stock < line.quantity) throw new Error(`Existencia insuficiente: ${item?.name ?? "pieza desconocida"}. Actualiza el inventario.`);
      item.stock -= line.quantity;
      return { ...line, name: item.name };
    });
    const totalCents = lines.reduce((sum, l) => sum + l.quantity * l.priceCents, 0);
    if (!Number.isSafeInteger(totalCents) || totalCents > 100_000_000) throw new Error("El importe de la venta excede el límite.");
    next.sales.unshift({ id: requestId, createdAt: now, method: command.method, notes: command.notes, lines, totalCents });
  } else {
    const sale = next.sales.find(s => s.id === command.saleId);
    if (!sale || sale.voidReason) throw new Error("La venta no existe o ya está anulada.");
    sale.voidReason = command.reason;
    for (const line of sale.lines) next.items.find(i => i.id === line.itemId)!.stock += line.quantity;
  }
  if (Object.keys(next.requests).length >= 10000) throw new Error("Se alcanzó el límite de operaciones de este día.");
  next.requests[requestId] = signature;
  return next;
}

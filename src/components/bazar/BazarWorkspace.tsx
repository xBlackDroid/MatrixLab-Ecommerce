"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Minus, Plus, RefreshCw, ShoppingBag } from "lucide-react";
import { envelopeSchema, emptyBazar, money, pesos, lineTotal, tracksStock, type Bazar, type Command, type Item } from "@/lib/bazar/domain";
import styles from "./bazar.module.css";

type Intent = { date: string; requestId: string; command: Command };
type Draft = { itemId: string; quantity: number; price: string };
const storageKey = (date: string) => `matrixlab-bazar-pending:${date}`;
function csv(name: string, rows: (string | number)[][]) {
  const escape = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BazarWorkspace({ csrf, today }: { csrf: string; today: string }) {
  const [date, setDate] = useState(today), [state, setState] = useState<Bazar>(emptyBazar);
  const [tab, setTab] = useState("Vender"), [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [pending, setPending] = useState<Intent | null>(null), [cart, setCart] = useState<Draft[]>([]);
  const [method, setMethod] = useState<"efectivo" | "transferencia" | "tarjeta">("efectivo");
  const [notes, setNotes] = useState("");
  const [charge, setCharge] = useState(""), [received, setReceived] = useState(""), [category, setCategory] = useState("Todos");
  const lock = useRef(false);
  const version = useRef(-1);
  const disabled = busy || !!pending || loading;
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/admin/bazar?date=${date}`, { cache: "no-store", signal });
      const body = await res.json(); if (!res.ok) throw new Error(body.error);
      if (!signal?.aborted && body.version >= version.current) { version.current = body.version; setState(body.state); setLoading(false); }
    } catch (e) { if (!signal?.aborted) { setError(e instanceof Error ? e.message : "No pudimos actualizar."); setLoading(false); } }
  }, [date]);
  useEffect(() => {
    const controller = new AbortController(); version.current = -1; setLoading(true); setState(emptyBazar()); setCart([]); setCharge(""); setReceived(""); setError(""); setNotice(""); setPending(null);
    try { const raw = localStorage.getItem(storageKey(date)); const p = raw ? envelopeSchema.safeParse(JSON.parse(raw)) : null; setPending(p?.success && p.data.date === date ? p.data : null); } catch { /* Storage may be unavailable. */ }
    void load(controller.signal);
    const timer = setInterval(() => { if (!lock.current) void load(controller.signal); }, 15000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [date, load]);

  async function send(command: Command, retry?: Intent): Promise<boolean> {
    if (lock.current || (pending && !retry)) return false;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    const intent = retry ?? { date, requestId: crypto.randomUUID(), command };
    setPending(intent);
    try { localStorage.setItem(storageKey(intent.date), JSON.stringify(intent)); } catch { /* In-memory retry remains available. */ }
    try {
      const res = await fetch("/api/admin/bazar", { method: "POST", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf }, body: JSON.stringify(intent) });
      const body = await res.json();
      if (!res.ok) {
        if (res.status === 400 || res.status === 409) { clearPending(intent.date); void load(); }
        throw new Error(body.error ?? "No pudimos confirmar. Reintenta la misma operación.");
      }
      if (body.version >= version.current) { version.current = body.version; setState(body.state); } clearPending(intent.date);
      if (intent.command.kind === "sale") { setCart([]); setCharge(""); setReceived(""); setNotes(""); setNotice("Venta registrada. El inventario y el corte ya están actualizados."); }
      else setNotice(intent.command.kind === "void" ? "Venta anulada. Las piezas regresaron al inventario." : "Inventario guardado.");
      return true;
    } catch (e) { setError(e instanceof Error ? e.message : "Sin conexión. Reintenta la misma operación cuando tengas señal."); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  function clearPending(day: string) { setPending(null); try { localStorage.removeItem(storageKey(day)); } catch { /* No persisted intent. */ } }
  function add(item: Item) {
    setCart(previous => {
      const line = previous.find(l => l.itemId === item.id);
      if (tracksStock(item) && (line?.quantity ?? 0) >= item.stock) return previous;
      return line ? previous.map(l => l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l) : [...previous, { itemId: item.id, quantity: 1, price: (item.priceCents / 100).toFixed(2) }];
    });
  }
  const activeSales = state.sales.filter(s => !s.voidReason);
  const total = activeSales.reduce((sum, s) => sum + s.totalCents, 0);
  const remaining = state.items.filter(tracksStock).reduce((sum, i) => sum + i.stock, 0);
  const uncounted = state.items.filter(i => !tracksStock(i)).length;
  const itemSold = (id: string) => activeSales.reduce((sum, sale) => sum + sale.lines.filter(l => l.itemId === id).reduce((n, l) => n + l.quantity, 0), 0);
  const sold = activeSales.reduce((sum, s) => sum + s.lines.reduce((n, l) => n + l.quantity, 0), 0);
  const cartTotal = cart.reduce((sum, l) => { const item = state.items.find(i => i.id === l.itemId); return sum + (item ? lineTotal(item, l.quantity, Math.round(Number(l.price || "0") * 100)) : 0); }, 0);
  const charged = charge === "" ? cartTotal : Math.round(Number(charge) * 100);
  const categories = ["Todos", ...new Set(state.items.map(i => i.category).filter((c): c is string => !!c))];
  const filtered = state.items.filter(i => `${i.name} ${i.sku}`.toLowerCase().includes(filter.toLowerCase()) && (category === "Todos" || i.category === category));

  return <div className={styles.root}>
    <div className={styles.toolbar}>
      <label className={styles.field}>Día del bazar<input type="date" value={date} min="2020-01-01" max="2100-12-31" disabled={busy || !!pending} onInput={e => { if (e.currentTarget.value) setDate(e.currentTarget.value); }} onChange={e => { if (e.target.value) setDate(e.target.value); }} /></label>
      <button className={styles.secondary} disabled={busy || loading} onClick={() => { setError(""); void load(); }}><RefreshCw size={16} aria-hidden />Actualizar</button>
      <button className={styles.secondary} disabled={loading} onClick={() => csv(`bazar-ventas-${date}.csv`, [["Folio", "Hora", "Estado", "Pago", "Pieza", "Cantidad", "Precio referencia MXN", "Total cobrado línea MXN", "Notas", "Motivo anulación"], ...state.sales.flatMap(s => s.lines.map(l => [s.id, new Date(s.createdAt).toLocaleString("es-MX", { timeZone: "America/Mexico_City" }), s.voidReason ? "Anulada" : "Registrada", s.method, l.name, l.quantity, (l.priceCents / 100).toFixed(2), ((l.totalCents ?? l.priceCents * l.quantity) / 100).toFixed(2), s.notes, s.voidReason ?? ""]))])}><Download size={16} aria-hidden />Descargar ventas</button>
    </div>
    <div className={styles.stats} aria-label="Corte del día">
      <div><span>Vendido hoy</span><strong>{money(total)}</strong><small>{activeSales.length} ventas registradas</small></div>
      <div><span>Piezas vendidas</span><strong>{sold}</strong><small>{state.items.filter(tracksStock).reduce((sum, i) => sum + i.brought, 0)} piezas con conteo inicial</small></div>
      <div><span>Por vender</span><strong>{remaining}</strong><small>piezas contadas{uncounted ? ` · ${uncounted} productos por contar` : ""}</small></div>
    </div>
    <div className={styles.payments}>{(["efectivo", "transferencia", "tarjeta"] as const).map(m => <span key={m}>{m}: <b>{money(activeSales.filter(s => s.method === m).reduce((sum, s) => sum + s.totalCents, 0))}</b></span>)}</div>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {pending && <div className={styles.pending}><p>Hay una operación pendiente de confirmar. Reinténtala antes de registrar otra; se guardará una sola vez.</p><button disabled={busy} className={styles.primary} onClick={() => void send(pending.command, pending)}>{busy ? "Confirmando…" : "Confirmar operación pendiente"}</button><a href="/admin/login">Volver a iniciar sesión</a></div>}
    <nav className={styles.tabs} aria-label="Secciones del bazar">{["Vender", "Inventario", "Ventas"].map(t => <button key={t} aria-current={tab === t ? "page" : undefined} onClick={() => setTab(t)}>{t}</button>)}</nav>
    {loading ? <p role="status">Cargando el bazar…</p> : <>
      {tab === "Vender" && <div className={styles.sellLayout}>
        <section><h2>Elige las piezas</h2><label className={styles.field}>Buscar por nombre o código<input type="search" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Ej. UV, vaso, imán…" /></label>
          <div className={styles.categories} aria-label="Filtrar por categoría">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div>
          {!state.items.length && <div className={styles.empty}><ShoppingBag size={32} aria-hidden /><h3>Todo listo para el primer bazar</h3><p>Agrega las piezas y cantidades que llevan para empezar a vender.</p><button className={styles.primary} onClick={() => setTab("Inventario")}>Cargar lo que llevamos</button></div>}
          {!!state.items.length && !filtered.length && <p>No hay piezas con esa búsqueda.</p>}
          <div className={styles.products}>{filtered.map(i => <button key={i.id} className={styles.product} disabled={disabled || (tracksStock(i) && (i.stock === 0 || (cart.find(l => l.itemId === i.id)?.quantity ?? 0) >= i.stock))} onClick={() => add(i)}><span className={styles.productCode}>{i.sku || "Pieza"}</span><strong>{i.name}</strong><span>{money(i.priceCents)}</span><small>{tracksStock(i) ? (i.stock ? `${i.stock} disponibles` : "Agotado") : "Cantidad por confirmar"}</small>{i.bundle && <small>{i.bundle.quantity} por {money(i.bundle.totalCents)}</small>}<Plus size={18} aria-hidden /></button>)}</div>
        </section>
        <form className={styles.ticket} onSubmit={e => { e.preventDefault(); try { void send({ kind: "sale", method, notes, totalCents: charge === "" ? cartTotal : pesos(charge), ...(method === "efectivo" && received !== "" ? { receivedCents: pesos(received) } : {}), lines: cart.map(l => ({ itemId: l.itemId, quantity: l.quantity, priceCents: pesos(l.price) })) }); } catch (e) { setError((e as Error).message); } }}>
          <h2>Nueva venta</h2>{!cart.length && <p>Toca una pieza para agregarla a la venta.</p>}
          {cart.map(line => { const item = state.items.find(i => i.id === line.itemId)!; return <div key={line.itemId} className={styles.ticketLine}><strong>{item?.name ?? "Pieza"}</strong><div className={styles.lineControls}><button type="button" className={styles.iconButton} aria-label={`Quitar una unidad de ${item?.name}`} disabled={disabled} onClick={() => setCart(c => c.flatMap(l => l.itemId !== line.itemId ? [l] : l.quantity > 1 ? [{ ...l, quantity: l.quantity - 1 }] : []))}><Minus size={16} /></button><span>{line.quantity}</span><button type="button" className={styles.iconButton} aria-label={`Agregar una unidad de ${item?.name}`} disabled={disabled || (item && tracksStock(item) && line.quantity >= item.stock)} onClick={() => add(item)}><Plus size={16} /></button><label className={styles.field}>Precio por pieza<input type="number" min="0" max="1000000" step="0.01" required inputMode="decimal" value={line.price} disabled={disabled} onChange={e => setCart(c => c.map(l => l.itemId === line.itemId ? { ...l, price: e.target.value } : l))} /></label></div></div>; })}
          <label className={styles.field}>Forma de pago<select value={method} disabled={disabled} onChange={e => setMethod(e.target.value as typeof method)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="tarjeta">Tarjeta</option></select></label>
          <label className={styles.field}>Nota (opcional)<input maxLength={300} value={notes} disabled={disabled} onChange={e => setNotes(e.target.value)} placeholder="Promoción, referencia…" /></label>
          <div className={styles.total}><span>Precio de lista / promoción</span><strong>{money(cartTotal)}</strong></div>
          <label className={styles.field}>Monto a cobrar MXN<input type="number" min="0" max="1000000" step="0.01" inputMode="decimal" disabled={disabled || !cart.length} value={charge} placeholder={(cartTotal / 100).toFixed(2)} onChange={e => setCharge(e.target.value)} /><small>Déjalo vacío para cobrar el total calculado. Puedes escribir el precio acordado.</small></label>
          {method === "efectivo" && <label className={styles.field}>Efectivo recibido MXN (opcional)<input type="number" min={(charged / 100).toFixed(2)} max="1000000" step="0.01" inputMode="decimal" disabled={disabled || !cart.length} value={received} onChange={e => setReceived(e.target.value)} placeholder="Para calcular el cambio" /></label>}
          <div className={styles.total}><span>Total a pagar</span><strong>{money(charged)}</strong></div>
          {method === "efectivo" && received !== "" && <p role="status">Cambio: {money(Math.max(0, Math.round(Number(received) * 100) - charged))}</p>}
          <button className={styles.primary} disabled={disabled || !cart.length}>{busy ? "Guardando…" : "Registrar venta cobrada"}</button><small>Registra la venta después de recibir el pago.</small>
        </form>
      </div>}
      {tab === "Inventario" && <>
        <section className={styles.panel}><h2>Lo que llevamos</h2><p>Este inventario corresponde al bazar. Registra aquí las piezas separadas para el evento.</p><form className={styles.itemForm} onSubmit={async e => { e.preventDefault(); const form = e.currentTarget, values = new FormData(form); try { const ok = await send({ kind: "item", name: String(values.get("name")), sku: String(values.get("sku")), quantity: Number(values.get("quantity")), priceCents: pesos(String(values.get("price"))) }); if (ok) form.reset(); } catch (e) { setError((e as Error).message); } }}><label className={styles.field}>Nombre / diseño<input name="name" maxLength={120} required disabled={disabled} placeholder="Gorra Padel Queen rosa" /></label><label className={styles.field}>Código (opcional)<input name="sku" maxLength={60} disabled={disabled} placeholder="GO001-ROSA" /></label><label className={styles.field}>Cantidad que llevamos<input name="quantity" type="number" min="1" max="100000" step="1" defaultValue="1" inputMode="numeric" required disabled={disabled} /></label><label className={styles.field}>Precio de venta MXN<input name="price" type="number" min="0" max="1000000" step="0.01" inputMode="decimal" required disabled={disabled} placeholder="279.00" /></label><button className={styles.primary} disabled={disabled}>Agregar pieza</button></form></section>
        {!!state.items.length && <section className={styles.panel}><div className={styles.toolbar}><h2>Inventario del día</h2><button className={styles.secondary} onClick={() => csv(`bazar-inventario-${date}.csv`, [["Código", "Pieza", "Precio MXN", "Llevamos", "Vendidas", "Quedan"], ...state.items.map(i => [i.sku, i.name, (i.priceCents / 100).toFixed(2), tracksStock(i) ? i.brought : "Sin contar", itemSold(i.id), tracksStock(i) ? i.stock : "Sin contar"])])}>Descargar inventario</button></div><div className={styles.tableWrap}><table><thead><tr><th>Pieza</th><th>Precio</th><th>Llevamos</th><th>Vendidas</th><th>Quedan</th></tr></thead><tbody>{state.items.map(i => <tr key={i.id}><td><strong>{i.name}</strong><small>{i.sku}</small></td><td>{money(i.priceCents)}</td><td>{tracksStock(i) ? i.brought : "Sin contar"}</td><td>{itemSold(i.id)}</td><td>{tracksStock(i) ? i.stock : "Sin contar"}</td></tr>)}</tbody></table></div><form className={styles.restock} onSubmit={async e => { e.preventDefault(); const f = e.currentTarget, d = new FormData(f); if (await send({ kind: "count", itemId: String(d.get("itemId")), remaining: Number(d.get("remaining")) })) f.reset(); }}><label className={styles.field}>Contar o corregir existencias<select name="itemId" disabled={disabled}>{[...state.items].sort((a, b) => Number(tracksStock(a)) - Number(tracksStock(b))).map(i => <option key={i.id} value={i.id}>{i.name}{tracksStock(i) ? "" : " · sin contar"}</option>)}</select></label><label className={styles.field}>Piezas que quedan físicamente<input name="remaining" type="number" min="0" max="100000" step="1" inputMode="numeric" required disabled={disabled} /></label><button className={styles.secondary} disabled={disabled}>Guardar conteo</button></form><form className={styles.restock} onSubmit={async e => { e.preventDefault(); const f = e.currentTarget, d = new FormData(f); if (await send({ kind: "stock", itemId: String(d.get("itemId")), quantity: Number(d.get("quantity")) })) f.reset(); }}><label className={styles.field}>Agregar stock a una pieza<select name="itemId" disabled={disabled}>{state.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label className={styles.field}>Piezas adicionales<input name="quantity" type="number" min="1" max="100000" defaultValue="1" step="1" inputMode="numeric" required disabled={disabled} /></label><button className={styles.secondary} disabled={disabled}>Agregar stock</button></form></section>}
      </>}
      {tab === "Ventas" && <section className={styles.panel}><h2>Ventas del día</h2>{!state.sales.length && <p>Aún no hay ventas registradas para este día.</p>}{state.sales.map(s => <article key={s.id} className={styles.sale}><div className={styles.toolbar}><strong>{money(s.totalCents)}</strong><span>{s.method}</span><time dateTime={s.createdAt}>{new Date(s.createdAt).toLocaleTimeString("es-MX", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit" })}</time><small>Folio {s.id.slice(0, 8)}</small></div>{s.lines.map(l => <p key={l.itemId}>{l.quantity} × {l.name} · {money(l.totalCents ?? l.quantity * l.priceCents)}</p>)}{s.subtotalCents !== undefined && s.subtotalCents !== s.totalCents && <p>Lista / promoción: {money(s.subtotalCents)} · Cobrado: {money(s.totalCents)}</p>}{s.receivedCents !== undefined && <p>Recibido: {money(s.receivedCents)} · Cambio: {money(s.changeCents ?? 0)}</p>}{s.notes && <p>{s.notes}</p>}{s.voidReason ? <p className={styles.error}>Anulada: {s.voidReason}</p> : <details><summary>Anular venta y regresar piezas</summary><form className={styles.restock} onSubmit={e => { e.preventDefault(); const reason = String(new FormData(e.currentTarget).get("reason")); void send({ kind: "void", saleId: s.id, reason }); }}><label className={styles.field}>Motivo de anulación<input name="reason" required minLength={3} maxLength={200} disabled={disabled} /></label><button className={styles.secondary} disabled={disabled}>Confirmar anulación</button></form></details>}</article>)}</section>}
    </>}
    <p className={styles.footer}>Guardado en MatrixLab · Actualización cada 15 segundos · Las ventas anuladas se conservan en el historial.</p>
  </div>;
}

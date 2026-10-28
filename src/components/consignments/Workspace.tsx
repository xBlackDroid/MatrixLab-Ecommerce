"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { RefreshCw } from "lucide-react";
import AccessPanel from "./AccessPanel";
import styles from "./portal.module.css";
import type { AdminSection } from "@/lib/consignments/navigation";
import { CommandSchema, account, formatMoney, parsePesos, type Command, type Item, type Quote, type Snapshot } from "@/lib/consignments/domain";

const input = styles.input;
const control = `${styles.btn} ${styles.ghost}`;
const button = `${styles.btn} ${styles.primary}`;
const panel = styles.panel;
const sectionLabel: Record<string, string> = { "Estado de cuenta": "Cuenta" };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className={styles.field}>{label}{children}</label>;
}
function data(form: HTMLFormElement) { return Object.fromEntries(new FormData(form).entries()) as Record<string, string>; }
function dollars(cents: number) { return (cents / 100).toFixed(2); }

export default function Workspace({ distributorId, admin, csrf, initialSection = "Inventario" }: { distributorId: string; admin: boolean; csrf: string; initialSection?: AdminSection }) {
  const [s, setS] = useState<Snapshot | null>(null), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [tab, setTab] = useState<string>(admin ? initialSection : "Inventario"), [busy, setBusy] = useState(false), [sync, setSync] = useState("");
  const [cart, setCart] = useState<{ itemId: string; quantity: number; priceCents: number; zeroReason?: string }[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null), [filter, setFilter] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const [page, setPage] = useState(0), [editing, setEditing] = useState<Item | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [review, setReview] = useState<Command | null>(null);
  const intent = useRef<{ command: Command; key: string } | null>(null);
  const pendingForm = useRef<HTMLFormElement | null>(null);
  const endpoint = admin ? "/api/admin/distributors" : "/api/distributor";
  const query = admin ? `?id=${distributorId}` : "";
  const accountQuery = new URLSearchParams({ ...(admin ? { id: distributorId } : {}), page: String(page), ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString();
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(endpoint + "?" + accountQuery, { cache: "no-store" }); const result = await r.json();
      if (!r.ok || !result.ok) throw new Error(result.error);
      setS(result.snapshot); setSync(new Date().toLocaleTimeString("es-MX", { timeZone: "America/Mexico_City" }));
    } catch (e) { setError((e as Error).message || "No pudimos actualizar. Los datos visibles pueden estar desactualizados."); }
  }, [endpoint, accountQuery]);
  useEffect(() => {
    void refresh(); const timer = setInterval(() => { if (!document.hidden) void refresh(); }, 15000);
    const focus = () => void refresh(); window.addEventListener("focus", focus);
    return () => { clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [refresh]);
  async function send(command: Command, retry = false, confirmed = false) {
    setError(""); setNotice("");
    const validated = CommandSchema.safeParse(command);
    if (!validated.success) { setError("Revisa los campos: " + validated.error.issues[0].message); return null; }
    if (!retry && !confirmed && !["preview", "sale"].includes(command.action)) { setReview(validated.data); return null; }
    if (intent.current && !retry) { setError("Primero reintenta la confirmación pendiente."); return null; }
    const stored = retry ? intent.current : { command: validated.data, key: crypto.randomUUID() };
    if (!stored) return null;
    if (command.action !== "preview") intent.current = stored;
    setBusy(true);
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf,
        "Idempotency-Key": stored.key }, body: JSON.stringify(admin ? { distributorId, command: stored.command } : stored.command) });
      const result = await r.json();
      if (!r.ok || !result.ok) {
        if (r.status < 500) { intent.current = null; setUncertain(false); setReview(null); }
        else setUncertain(true);
        if (result.code === "CONS_PREVIEW_CHANGED") setQuote(null);
        throw new Error(result.error || "No pudimos confirmar.");
      }
      intent.current = null; setUncertain(false); setReview(null);
      if (stored.command.action === "preview") { setQuote(result.quote); return result; }
      pendingForm.current?.reset(); pendingForm.current = null;
      if (stored.command.action === "sale") { setCart([]); setQuote(null); }
      setNotice(`Guardado${result.result?.folio ? `: ${result.result.folio}` : "."}`); await refresh();
      return result;
    } catch (e) { if (intent.current) setUncertain(true); setError((e as Error).message || "No hay conexión. Reintenta la misma confirmación."); return null; }
    finally { setBusy(false); }
  }
  function add(item: Item, quantity = 1, price = item.suggested_price_cents) {
    if (item.status !== "activa" || item.stock < quantity) { setError("Esta pieza no tiene existencias disponibles."); return; }
    setCart((old) => {
      const existing = old.find((l) => l.itemId === item.id);
      if (existing && existing.quantity + quantity > item.stock) { setError("La cantidad supera el stock disponible."); return old; }
      return existing ? old.map((l) => l.itemId === item.id ? { ...l, quantity: l.quantity + quantity } : l)
        : [...old, { itemId: item.id, quantity, priceCents: price }];
    });
    setQuote(null); setTab("Venta");
  }
  async function scan(code: string) {
    try {
      const r = await fetch(endpoint + (query || "?") + (query ? "&" : "") + `scan=${encodeURIComponent(code.trim())}`);
      const result = await r.json(); if (!r.ok) throw new Error(result.error); add(result.item);
    } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { const code = new URLSearchParams(window.location.search).get("scan"); if (code && s) { void scan(code); window.history.replaceState({}, "", window.location.pathname); } }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  async function label(item: Item) {
    const w = window.open("", "_blank"); if (!w) { setError("Permite abrir la etiqueta en otra ventana."); return; }
    const image = await QRCode.toDataURL(item.scan_code, { width: 200, margin: 2 });
    w.opener = null; const doc = w.document; doc.title = "Etiqueta " + item.sku;
    const container = doc.createElement("div"); container.style.cssText = "font-family:sans-serif;width:65mm;text-align:center;padding:5mm;border:1px solid #ccc";
    const img = doc.createElement("img"); img.src = image; img.alt = "QR " + item.sku; container.append(img);
    for (const t of [item.name, item.variant_label ?? "", item.sku]) { const line = doc.createElement("p"); line.textContent = t; container.append(line); }
    doc.body.append(container); await img.decode(); w.print();
  }
  async function submit(e: React.FormEvent<HTMLFormElement>, build: (v: Record<string, string>) => Command) {
    e.preventDefault(); const form = e.currentTarget;
    try { const command = build(data(form)); pendingForm.current = form; const result = await send(command); if (result) form.reset(); }
    catch (e) { setError((e as Error).message); }
  }
  const sections = ["Inventario", "Venta", "Estado de cuenta"];
  const adminTabs = admin ? ["Piezas", "Entregas", "Pagos", "Correcciones", "Accesos"] : [];
  const range = (date: string) => (!from || date >= from) && (!to || date <= to);
  const summary = s ? account(s) : null;
  return <div className={styles.portal}>
    <header className={`${styles.topline} ${admin ? "" : styles.distributorTopline}`}><div>
      <p className={styles.eyebrow}>{admin ? "Cuenta de distribuidor" : "Tu cuenta"}</p>
      <h2 className={styles.title}>{s?.distributor.name || "Cargando cuenta…"}</h2>
      <p className={styles.subtitle}>{admin ? "Registra solo las piezas que entregas a este distribuidor." : "Tus piezas, ventas y pagos a MatrixLab."}</p></div>
      <div className={styles.toplineActions}>{admin && <Link className={control} href="/admin/distribuidores">Ver distribuidores</Link>}<button className={control} onClick={() => void refresh()}><RefreshCw aria-hidden size={16} strokeWidth={1.75} />Actualizar</button>
        {admin && s && <button disabled={busy || uncertain || !!review} className={control} onClick={() => void send({ action: "distributor_update", payload: { active: !s.distributor.is_active } })}>{s.distributor.is_active ? "Desactivar distribuidor" : "Reactivar distribuidor"}</button>}</div></header>
    <p className={styles.meta}>Actualización: {sync || "pendiente"} · Importes en MXN</p>
    {error && <div role="alert" className={styles.alert}>{error}</div>}
    {notice && <p role="status" className={styles.notice}>{notice}</p>}
    {uncertain && <div className={`${panel} ${styles.panelAccent}`}><p className="text-sm">No sabemos si la operación se confirmó. Reintenta con la misma clave antes de registrar otra.</p>
      <button disabled={busy} className={button + " mt-3"} onClick={() => intent.current && void send(intent.current.command, true)}>Reintentar confirmación anterior</button></div>}
    {review && s && <div role="dialog" aria-modal="false" aria-label="Revisar operación" className={`${panel} ${styles.panelAccent}`}>
      <h3 className={styles.panelTitle}>Revisa la operación para {s.distributor.name}</h3>
      <Review command={review} snapshot={s} />
      <div className="mt-4 flex flex-wrap gap-3"><button disabled={busy || uncertain} className={button} onClick={() => void send(review, false, true)}>Confirmar operación</button>
        <button disabled={busy || uncertain} className={control} onClick={() => setReview(null)}>Volver a editar</button></div></div>}
    {!s && !error && <div className="grid gap-4" aria-hidden><div className={styles.skeletonStats}>{[0, 1, 2, 3].map((n) => <div key={n} className={`${styles.skeleton} ${styles.skeletonStat}`} />)}</div>
      <div className={`${styles.skeleton} ${styles.skeletonBar}`} /><div className={`${styles.skeleton} ${styles.skeletonPanel}`} /></div>}
    {!s && !error && <p role="status" className={styles.meta}>Cargando tu cuenta…</p>}
    {s && summary && <>
      {admin && <section className={`${panel} ${styles.panelAccent}`} aria-label="Configurar inventario y acceso">
        <h3 className={styles.panelTitle}>Inventario exclusivo de {s.distributor.name}</h3>
        <p className={styles.hint + " mt-2"}>Crea las piezas que le darás, confirma la cantidad y sus precios en una entrega, y vincula sus usuarios. Al iniciar sesión, cada usuario ve automáticamente el inventario de este distribuidor.</p>
        <div className={styles.setupActions}>
          <button className={button} disabled={busy || uncertain || !!review} onClick={() => { setEditing(null); setTab("Piezas"); setPage(0); }}>1. Crear pieza</button>
          <button className={control} disabled={busy || uncertain || !!review} onClick={() => { setTab("Entregas"); setPage(0); }}>2. Asignar stock</button>
          <button className={control} disabled={busy || uncertain || !!review} onClick={() => { setTab("Accesos"); setPage(0); }}>3. Vincular usuarios</button>
        </div>
      </section>}
      <nav aria-label="Secciones de consignación" className={`${styles.sectionNav} ${admin ? styles.adminSectionNav : ""}`}>
        <div className={styles.segmented}>{sections.map((t) => <button key={t} aria-current={tab === t ? "page" : undefined} aria-label={t}
          className={`${styles.segment} ${tab === t ? styles.segmentOn : ""}`} onClick={() => { setTab(t); setPage(0); }}><span className={styles.segmentDot} aria-hidden />{sectionLabel[t] ?? t}</button>)}</div>
        {!!adminTabs.length && <div className={styles.adminTabs}>{adminTabs.map((t) => <button key={t} aria-current={tab === t ? "page" : undefined}
          className={`${styles.adminTab} ${tab === t ? styles.adminTabOn : ""}`} onClick={() => { setTab(t); setPage(0); }}>{t}</button>)}</div>}
      </nav>
      <dl className={styles.stats}>
        {[["Piezas disponibles", s.items.reduce((n, i) => n + Number(i.stock), 0)], ["Valor del stock a costo", formatMoney(summary.inventoryValue)],
          [admin ? "Pagos recibidos de " + s.distributor.name : "Pagos a MatrixLab", formatMoney(summary.paid)], ["Por pagar", formatMoney(summary.pending)]].map(([title, value]) =>
          <div className={styles.stat} key={title}><dt className={styles.statLabel}>{title}</dt><dd className={styles.statValue}>{value}</dd></div>)}
      </dl>
      <p className={styles.statHint}>El stock se valora al costo de cada entrega. «Por pagar» baja con los pagos que MatrixLab registra.</p>
      {s.pagination && Math.max(s.pagination.sales, s.pagination.payments, s.pagination.deliveries, s.pagination.returns, s.pagination.adjustments) > 20 &&
        <div className="flex flex-wrap items-center gap-3"><button className={control} disabled={page === 0} onClick={() => setPage(page - 1)}>Página anterior de documentos</button><span className={styles.hint}>Página {page + 1}</span>
          <button className={control} disabled={Math.max(s.pagination.sales, s.pagination.payments, s.pagination.deliveries, s.pagination.returns, s.pagination.adjustments) <= (page + 1) * 20} onClick={() => setPage(page + 1)}>Página siguiente de documentos</button></div>}
      <fieldset disabled={busy || uncertain || !!review} className="min-w-0 space-y-5">
      {tab === "Inventario" && <>
        <Field label="Buscar en las piezas de este distribuidor"><input className={input} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Nombre o SKU" /></Field>
        {!s.items.length && <div className={panel}><h3 className={styles.panelTitle}>Aún no hay piezas registradas</h3><p className="mt-2 text-sm text-ml-white/70">El inventario se forma con cada entrega que confirma MatrixLab.</p>
          {admin && <button className={button + " mt-4"} onClick={() => setTab("Piezas")}>Agregar pieza a {s.distributor.name}</button>}</div>}
        {!!s.items.length && !s.items.some((i) => `${i.name} ${i.sku}`.toLowerCase().includes(filter.toLowerCase())) &&
          <p className={styles.hint}>Ninguna pieza coincide con «{filter}».</p>}
        <div className={styles.itemGrid}>{s.items.filter((i) => `${i.name} ${i.sku}`.toLowerCase().includes(filter.toLowerCase())).map((i) => {
          const costs = [...new Set(s.lots.filter((l) => l.item_id === i.id && l.available_quantity > 0).map((l) => l.unit_cost_cents))];
          return <article className={styles.itemCard} key={i.id}>{i.image_url && <Image unoptimized src={i.image_url} alt={i.name} width={600} height={400} className={styles.itemImage} />}
            <div><h3 className={styles.itemName}>{i.name}</h3><p className={styles.itemMeta}>{i.sku} {i.variant_label} · {i.commercial_unit}</p></div>
            <p className={styles.stockLine}><span className={styles.stockValue}>{i.stock}</span><span className={styles.stockWord}>{Number(i.stock) === 1 ? "disponible" : "disponibles"}</span></p>
            <div className={styles.priceGrid}>
              <div className={styles.priceCell}><p className={styles.priceLabel}>{admin ? `Costo para ${s.distributor.name}` : "Tu costo"}</p><p className={styles.priceValue}>{costs.length > 1 ? "Según lote" : costs.length ? formatMoney(costs[0]) : "Sin lote"}</p></div>
              <div className={styles.priceCell}><p className={styles.priceLabel}>Precio sugerido</p><p className={styles.priceValue}>{formatMoney(i.suggested_price_cents)}</p></div>
            </div>
            {costs.length > 1 && <details className="text-sm"><summary className={styles.disclosure}>Ver costos por lote</summary>{s.lots.filter((l) => l.item_id === i.id && l.available_quantity > 0).map((l) => <p className={styles.hint} key={l.id}>{l.available_quantity} × {formatMoney(l.unit_cost_cents)}</p>)}</details>}
            <p className={styles.statusTag}>Estado: {i.status}</p>
            <div className={styles.itemActions}><button className={button} disabled={i.stock < 1 || i.status !== "activa"} onClick={() => add(i)}>Registrar venta</button>
              <button className={control} onClick={() => void label(i)}>Etiqueta QR</button>
              {admin && <button className={control} onClick={() => { setEditing(i); setTab("Piezas"); }}>Editar ficha</button>}</div></article>;
        })}</div>
      </>}
      {tab === "Venta" && <div className={panel}>
        <h3 className={styles.panelTitle + " mb-4"}>Registrar venta</h3>
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); const v = data(e.currentTarget); void scan(v.code); }}>
          <Field label="Escanear con lector o capturar SKU"><input name="code" className={input} required placeholder="Código + Enter" /></Field><button className={button}>Agregar por código</button>
          {!admin && <Link href="/distribuidores/escanear" className={control + " sm:col-span-2"}>Usar cámara</Link>}
        </form>
        <div className="mt-4"><Field label="Agregar pieza manualmente"><select className={input} value="" onChange={(e) => { const i = s.items.find((i) => i.id === e.target.value); if (i) add(i); }}><option value="">Seleccionar pieza…</option>{s.items.filter((i) => i.stock > 0 && i.status === "activa").map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}</select></Field></div>
        <div className="mt-5 space-y-3">{cart.map((line) => <div key={line.itemId} className={`${styles.inner} grid gap-3 sm:grid-cols-3`}>
          <p className={styles.itemName + " sm:col-span-3"}>{s.items.find((i) => i.id === line.itemId)?.name}</p>
          <Field label="Cantidad"><input className={input} type="number" min="1" max={s.items.find((i) => i.id === line.itemId)?.stock} value={line.quantity} onChange={(e) => { setCart(cart.map((l) => l === line ? { ...l, quantity: Number(e.target.value) } : l)); setQuote(null); }} /></Field>
          <Field label="Precio real unitario MXN"><input className={input} type="number" min="0" step="0.01" value={dollars(line.priceCents)} onChange={(e) => { try { const amount = parsePesos(e.target.value); setCart(cart.map((l) => l === line ? { ...l, priceCents: amount } : l)); setQuote(null); } catch { setError("Revisa el monto."); } }} /></Field>
          <button className={control + " self-end"} onClick={() => { setCart(cart.filter((l) => l !== line)); setQuote(null); }}>Quitar pieza</button>
          {line.priceCents === 0 && <Field label="Motivo del precio cero"><input className={input} minLength={3} value={line.zeroReason ?? ""} onChange={(e) => { setCart(cart.map((l) => l === line ? { ...l, zeroReason: e.target.value } : l)); setQuote(null); }} /></Field>}
        </div>)}</div>
        {!cart.length && <p className="my-5 text-sm text-ml-white/70">Agrega las piezas vendidas. Escanear solo prepara el registro.</p>}
        {quote && <div className={`${styles.inner} ${styles.panelAccent} my-5`}><h4 className={styles.panelTitle}>Revisa antes de confirmar</h4>
          {quote.lines.map((l) => <p className="mt-2 text-sm" key={l.itemId}>{l.quantity} × {l.name}: costo pactado total {formatMoney(l.debtCents)}{l.priceCents * l.quantity < l.debtCents && <strong className="mt-1 block text-ml-coral">El precio real está por debajo del costo; la deuda sigue siendo el costo pactado.</strong>}</p>)}
          <p className="mt-3 text-sm text-ml-white/70">Venta al público: <span className="tabular-nums text-ml-white">{formatMoney(quote.publicCents)}</span></p>
          <p className={styles.statLabel + " mt-3"}>A pagar a MatrixLab</p><p className={styles.statValue}>{formatMoney(quote.debtCents)}</p></div>}
        <button className={button + " mt-4 " + styles.cta} disabled={!cart.length} onClick={() => void send(quote ? { action: "sale", payload: { lines: cart, fingerprint: quote.fingerprint } } : { action: "preview", payload: { lines: cart } })}>{quote ? "Confirmar venta" : "Revisar venta"}</button>
      </div>}
      {admin && tab === "Piezas" && <div className={panel}><h3 className={styles.panelTitle + " mb-4"}>{editing ? "Editar ficha" : "Agregar pieza privada"}</h3>
        <p className="mb-4 text-sm text-ml-white/70">Esta ficha no publica productos ni copia existencias de la tienda. Después registra la entrega.</p>
        <form key={editing?.id ?? "new"} className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void submit(e, (v) => ({ action: "item", payload: {
          ...(editing ? { id: editing.id } : {}), name: v.name, sku: v.sku, unit: v.unit as "pieza", suggestedCents: parsePesos(v.suggested),
          ...(v.variant ? { variant: v.variant } : {}), ...(v.description ? { description: v.description } : {}), ...(v.image ? { image: v.image } : {}),
          ...(v.variantId ? { variantId: v.variantId } : {}), status: v.status as "activa" | "inactiva" } }))}>
          <Field label="Nombre"><input className={input} name="name" required maxLength={160} defaultValue={editing?.name} /></Field>
          <Field label="SKU / código interno"><input className={input} name="sku" required pattern="[A-Za-z0-9][A-Za-z0-9._-]{1,59}" defaultValue={editing?.sku} /></Field>
          <Field label="Variante (opcional)"><input className={input} name="variant" defaultValue={editing?.variant_label ?? ""} /></Field>
          <Field label="Unidad comercial"><select className={input} name="unit" defaultValue={editing?.commercial_unit ?? "pieza"}>{["pieza", "paquete", "juego", "par", "kit"].map((v) => <option key={v}>{v}</option>)}</select></Field>
          <Field label="Precio sugerido MXN"><input className={input} type="number" min="0" step="0.01" name="suggested" required defaultValue={editing ? dollars(editing.suggested_price_cents) : ""} /></Field>
          <Field label="Foto: URL de Supabase o ruta de imagen (opcional)"><input className={input} name="image" defaultValue={editing?.image_url ?? ""} /></Field>
          <Field label="Descripción (opcional)"><textarea className={input} name="description" maxLength={1000} defaultValue={editing?.description ?? ""} /></Field>
          <Field label="Estado de la ficha"><select className={input} name="status" defaultValue={editing?.status === "inactiva" ? "inactiva" : "activa"}><option value="activa">Activa al confirmar entrega</option><option value="inactiva">Inactiva</option></select></Field>
          {!editing && <CatalogPicker endpoint={endpoint} input={input} />}
          <div className="flex flex-wrap gap-3 md:col-span-2"><button className={button}>Guardar ficha</button><button type="button" className={control} onClick={() => setEditing(null)}>Crear otra pieza</button><button type="button" className={control} onClick={() => setTab("Entregas")}>Registrar entrega</button></div>
        </form></div>}
      {admin && tab === "Entregas" && <div className={panel}><h3 className={styles.panelTitle + " mb-4"}>Confirmar entrega de piezas</h3><p className="mb-4 text-sm text-ml-white/70">El stock de la tienda no cambia. Concilia la salida física en MatrixLab si corresponde.</p>
        <DeliveryForm s={s} submit={submit} /><h4 className="mt-6 font-semibold">Entregas registradas</h4>{s.deliveries.map((d) => <p className="mt-2 text-sm" key={d.id}>{d.folio} · {d.effective_date} · {d.status}</p>)}</div>}
      {admin && tab === "Pagos" && <div className={panel}><h3 className={styles.panelTitle + " mb-4"}>Registrar pago recibido de {s.distributor.name}</h3><p className="mb-4 text-sm text-ml-white/70">Registra lo que {s.distributor.name} pagó a MatrixLab. Se aplica a ventas pendientes en orden de antigüedad. El excedente queda como saldo a favor del distribuidor y es independiente del valor de las piezas. Esto no realiza una transferencia.</p>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void submit(e, (v) => ({ action: "payment", payload: { amountCents: parsePesos(v.amount), method: v.method as "efectivo", date: v.date, reference: v.reference,
          ...(v.creditOnly === "on" ? { targets: [] } : Object.keys(v).some((k) => k.startsWith("apply-") && v[k])
            ? { targets: Object.keys(v).filter((k) => k.startsWith("apply-") && v[k]).map((k) => ({ saleId: k.slice(6), amountCents: parsePesos(v[k]) })) } : {}) } }))}>
          <Field label="Monto recibido MXN"><input className={input} type="number" min="0.01" step="0.01" name="amount" required /></Field>
          <Field label="Método"><select name="method" className={input}><option value="transferencia">Transferencia</option><option value="efectivo">Efectivo</option><option value="otro">Otro</option></select></Field>
          <Field label="Fecha del pago"><input className={input} type="date" name="date" required /></Field><Field label="Referencia"><input className={input} name="reference" maxLength={120} /></Field>
          <details className="md:col-span-2"><summary className={styles.disclosure}>Aplicar a ventas específicas (opcional)</summary><div className="grid gap-3 md:grid-cols-2">{s.sales.filter((v) => v.pending_cents > 0).map((v) => <Field key={v.id} label={`${v.folio} · pendiente ${formatMoney(v.pending_cents)} · importe a aplicar MXN`}><input className={input} type="number" min="0.01" max={dollars(v.pending_cents)} step="0.01" name={`apply-${v.id}`} /></Field>)}</div></details>
          <label className={styles.checkRow + " md:col-span-2"}><input type="checkbox" name="creditOnly" className="h-5 w-5 accent-ml-violet" />Guardar todo como crédito, sin aplicarlo todavía</label><button className={button}>Confirmar pago recibido</button>
        </form>
        <h4 className="mb-3 mt-6 font-semibold">Aplicar crédito existente</h4><form className="grid gap-4 md:grid-cols-3" onSubmit={(e) => void submit(e, (v) => ({ action: "apply_credit", payload: { paymentId: v.payment, targets: [{ saleId: v.sale, amountCents: parsePesos(v.amount) }] } }))}>
          <Field label="Pago con crédito"><select className={input} name="payment" required><option value="">Selecciona…</option>{s.payments.filter((p) => p.available_cents > 0).map((p) => <option value={p.id} key={p.id}>{p.folio} ({formatMoney(p.available_cents)})</option>)}</select></Field>
          <Field label="Venta pendiente"><select className={input} name="sale" required><option value="">Selecciona…</option>{s.sales.filter((v) => v.pending_cents > 0).map((v) => <option value={v.id} key={v.id}>{v.folio} ({formatMoney(v.pending_cents)})</option>)}</select></Field>
          <Field label="Monto a aplicar MXN"><input className={input} name="amount" type="number" min="0.01" step="0.01" required /></Field><button className={button}>Confirmar aplicación</button>
        </form></div>}
      {tab === "Estado de cuenta" && <>
        <p className={styles.statHint}>Las cifras de arriba son globales. Los filtros siguientes afectan el historial y la exportación del periodo.</p>
        <div className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,10rem))_auto] sm:items-end"><Field label="Desde"><input className={input} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} /></Field><Field label="Hasta"><input className={input} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} /></Field>
          <a className={control} href={endpoint + (query || "?") + (query ? "&" : "") + `export=csv&${new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) })}`}>Exportar estado CSV</a></div>
        <div className={panel}><h3 className={styles.panelTitle}>Ventas</h3>{s.sales.filter((v) => range(v.effective_date)).map((v) => <details className={styles.inner + " mt-3"} key={v.id}><summary className={styles.summaryRow}><strong className="text-ml-white">{v.folio}</strong> · {v.effective_date} · {v.status === "anulada" ? "Anulada" : v.pending_cents === 0 ? "Pagada" : v.applied_cents > 0 ? "Parcialmente pagada" : "Pendiente"}<span className="mt-1 block tabular-nums text-ml-white">Por pagar: {formatMoney(v.pending_cents)}</span></summary>
          <div className="mt-2 space-y-1 text-sm">{s.saleLines.filter((l) => l.sale_id === v.id).map((l) => <p key={l.id}>{l.quantity} × {l.item_name_snapshot} · devueltas: {l.returned_quantity}</p>)}
          <p className={styles.hint}>Venta al público: {formatMoney(v.public_total_cents)}</p><p className={styles.hint}>Total a MatrixLab: {formatMoney(v.net_debt_cents)}</p><p className={styles.hint}>Pagado: {formatMoney(v.applied_cents)}</p>
          {s.applications.filter((a) => a.sale_id === v.id).map((a) => <p className={styles.hint} key={a.id}>Pago {s.payments.find((p) => p.id === a.payment_id)?.folio}: {formatMoney(a.amount_cents)} ({a.status})</p>)}</div></details>)}
          {!s.sales.length && <p className={styles.hint + " mt-4"}>No hay ventas en esta página o periodo.</p>}</div>
        <div className={panel}><h3 className={styles.panelTitle}>{admin ? "Pagos recibidos de " + s.distributor.name : "Pagos a MatrixLab"}</h3>{s.payments.filter((p) => range(p.effective_date)).map((p) => <p className={styles.rowLine} key={p.id}>{p.folio} · {p.effective_date} · <span className="tabular-nums">{formatMoney(p.amount_cents)}</span> · {p.method} · {p.status}<span className={styles.hint + " block"}>Referencia: {p.reference || "Sin referencia"} · Aplicado: {formatMoney(p.applied_cents)} · Saldo a favor: {formatMoney(p.available_cents)}</span></p>)}{!s.payments.length && <p className={styles.hint + " mt-4"}>Todavía no hay pagos a MatrixLab registrados.</p>}</div>
        <div className={panel}><h3 className={styles.panelTitle}>Devoluciones y ajustes</h3><div className="mt-2 space-y-1 text-sm">{s.returns.filter((r) => range(r.effective_date)).map((r) => <p key={r.id}>{r.folio} · {r.effective_date} · deuda revertida {formatMoney(r.debt_reverted_cents)}</p>)}{s.adjustments.filter((a) => range(a.effective_date)).map((a) => <p key={a.id}>{a.folio} · {a.kind} · {a.quantity} unidades · {a.reason}</p>)}
          {!s.returns.length && !s.adjustments.length && <p className={styles.hint}>Sin devoluciones ni ajustes registrados.</p>}</div></div>
      </>}
      {admin && tab === "Correcciones" && <Corrections s={s} submit={submit} />}
      {admin && tab === "Accesos" && <AccessPanel distributorId={distributorId} distributorName={s.distributor.name} csrf={csrf} />}
      </fieldset>
    </>}
  </div>;
}

function CatalogPicker({ endpoint, input }: { endpoint: string; input: string }) {
  const [items, setItems] = useState<{ id: string; title: string; sku: string; products?: { title: string; images: unknown[] } | null }[]>([]), [error, setError] = useState(""), [query, setQuery] = useState("");
  return <div className="space-y-2 md:col-span-2"><button type="button" className={`${styles.btn} ${styles.ghost} ${styles.block}`} onClick={async () => {
    try { const r = await fetch(endpoint + "?catalog=1"); const d = await r.json(); if (!r.ok) throw new Error(d.error); setItems(d.catalog); } catch (e) { setError((e as Error).message); }
  }}>Vincular producto existente (opcional)</button>
    {!!items.length && <Field label="Buscar producto del catálogo"><input className={input} value={query} onChange={(e) => setQuery(e.target.value)} /></Field>}
    <Field label="Vínculo descriptivo al catálogo"><select name="variantId" className={input} onChange={(e) => { const v = items.find((i) => i.id === e.target.value); const form = e.target.form;
      if (v && form) { const name = form.elements.namedItem("name") as HTMLInputElement; const sku = form.elements.namedItem("sku") as HTMLInputElement;
        name.value = [v.products?.title, v.title].filter(Boolean).join(" · "); if (v.sku) sku.value = v.sku;
        const image = v.products?.images?.[0]; if (typeof image === "string") (form.elements.namedItem("image") as HTMLInputElement).value = image;
      } }}><option value="">Pieza independiente de la tienda</option>{items.filter((i) => `${i.products?.title} ${i.title} ${i.sku}`.toLowerCase().includes(query.toLowerCase())).map((i) => <option value={i.id} key={i.id}>{i.products?.title} {i.title} {i.sku}</option>)}</select></Field>{error && <p role="alert" className={styles.alert}>{error}</p>}</div>;
}
function DeliveryForm({ s, submit }: { s: Snapshot; submit: (e: React.FormEvent<HTMLFormElement>, build: (v: Record<string, string>) => Command) => Promise<void> }) {
  const [rows, setRows] = useState([0]);
  return <form className="grid gap-4 md:grid-cols-2" onSubmit={(e) => void submit(e, (v) => ({ action: "delivery", payload: {
    kind: v.kind as "inicial", date: v.date, reference: v.reference,
    lines: rows.map((n) => ({ itemId: v[`item${n}`], quantity: Number(v[`quantity${n}`]), costCents: parsePesos(v[`cost${n}`]), suggestedCents: parsePesos(v[`suggested${n}`]) })) } }))}>
    <Field label="Tipo"><select className={input} name="kind"><option value="inicial">Inventario inicial</option><option value="reposicion">Reposición</option></select></Field>
    <Field label="Fecha de entrega"><input className={input} name="date" type="date" required /></Field>
    {rows.map((n) => <div key={n} className={`${styles.inner} grid gap-3 md:col-span-2 md:grid-cols-2`}>
      <Field label={`Pieza de la entrega ${n + 1}`}><select className={input} name={`item${n}`} required><option value="">Selecciona…</option>{s.items.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.sku})</option>)}</select></Field>
      <Field label={`Cantidad entregada ${n + 1}`}><input className={input} name={`quantity${n}`} type="number" min="1" step="1" required /></Field>
      <Field label={`Costo unitario para ${s.distributor.name} MXN ${n + 1}`}><input className={input} name={`cost${n}`} type="number" min="0.01" step="0.01" required /></Field>
      <Field label={`Precio sugerido MXN ${n + 1}`}><input className={input} name={`suggested${n}`} type="number" min="0" step="0.01" required /></Field>
      {rows.length > 1 && <button type="button" className={control} onClick={() => setRows(rows.filter((r) => r !== n))}>Quitar renglón {n + 1}</button>}
    </div>)}
    <button type="button" disabled={rows.length >= 50} className={control} onClick={() => setRows([...rows, Math.max(...rows) + 1])}>Agregar otra pieza a la entrega</button>
    <Field label="Referencia"><input className={input} name="reference" maxLength={120} /></Field><button className={button}>Confirmar entrega</button>
  </form>;
}
function Review({ command: c, snapshot: s }: { command: Command; snapshot: Snapshot }) {
  if (c.action === "distributor_update") return <p className="mt-3">{c.payload.active ? "Reactivar" : "Desactivar"} {s.distributor.name}. Desactivar bloquea su acceso y nuevas ventas; MatrixLab puede seguir registrando pagos y correcciones.</p>;
  if (c.action === "delivery") return <div className="mt-3 space-y-2">{c.payload.lines.map((l, n) => <p key={n}>{l.quantity} × {s.items.find((i) => i.id === l.itemId)?.name}: costo unitario {formatMoney(l.costCents)}, sugerido {formatMoney(l.suggestedCents)}</p>)}<p>Fecha: {c.payload.date || "hoy"}. La entrega agrega piezas; no genera deuda.</p></div>;
  if (c.action === "payment") {
    const apply = c.payload.targets ? c.payload.targets.reduce((n, t) => n + t.amountCents, 0) : Math.min(account(s).pending, c.payload.amountCents);
    return <div className="mt-3"><p>Pago recibido: {formatMoney(c.payload.amountCents)} · {c.payload.method} · {c.payload.date || "hoy"}</p><p>Aplicación prevista: {formatMoney(apply)}. Crédito nuevo: {formatMoney(c.payload.amountCents - apply)}.</p>{c.payload.targets?.map((t) => <p key={t.saleId}>{s.sales.find((v) => v.id === t.saleId)?.folio}: {formatMoney(t.amountCents)}</p>)}</div>;
  }
  if (c.action === "item") return <p className="mt-3">Ficha privada: {c.payload.name} ({c.payload.sku}). Sugerido {formatMoney(c.payload.suggestedCents)}. No agrega stock hasta confirmar una entrega.</p>;
  if (c.action === "membership") return <p className="mt-3">Acceso de {c.payload.email}: {c.payload.status}. Desactivar revoca sus sesiones.</p>;
  if (c.action === "void_payment") { const p = s.payments.find((p) => p.id === c.payload.paymentId); return <p className="mt-3">Anular {p?.folio} de {formatMoney(p?.amount_cents ?? 0)}. Motivo: {c.payload.reason}. Sus aplicaciones volverán a quedar pendientes.</p>; }
  if (c.action === "apply_credit") return <div className="mt-3">{c.payload.targets.map((t) => <p key={t.saleId}>Aplicar {formatMoney(t.amountCents)} de crédito a {s.sales.find((v) => v.id === t.saleId)?.folio}. No registra dinero nuevo.</p>)}</div>;
  if (c.action === "return") return <div className="mt-3"><p>{c.payload.void ? "Anular venta" : "Devolución de cliente"}: {s.sales.find((v) => v.id === c.payload.saleId)?.folio}. Motivo: {c.payload.reason}.</p>{c.payload.allocations?.map((r) => { const a = s.allocations.find((a) => a.id === r.allocationId); return <p key={r.allocationId}>{r.quantity} unidades · deuda a revertir {formatMoney(r.quantity * (a?.unit_cost_cents ?? 0))} · {r.restock ? "reponer stock" : `destino: ${r.disposal}`}</p>; })}<p>Si la deuda disminuye por debajo de los pagos aplicados, el excedente quedará como crédito.</p></div>;
  if (c.action === "adjustment") return <p className="mt-3">Salida de {c.payload.quantity} unidades de {s.items.find((i) => i.id === c.payload.itemId)?.name}, por {c.payload.kind === "merma" ? "merma" : "retorno a MatrixLab"}. Motivo: {c.payload.reason}. No genera deuda.</p>;
  if (c.action === "reverse_delivery") return <p className="mt-3">Revertir {s.deliveries.find((d) => d.id === c.payload.deliveryId)?.folio}. Motivo: {c.payload.reason}. Solo se permite si no hubo movimientos posteriores.</p>;
  return <p className="mt-3">Confirmar cambios de este distribuidor.</p>;
}
function Corrections({ s, submit }: { s: Snapshot; submit: (e: React.FormEvent<HTMLFormElement>, build: (v: Record<string, string>) => Command) => Promise<void> }) {
  return <div className="grid gap-4 lg:grid-cols-2">
    <form className={panel + " grid gap-3"} onSubmit={(e) => void submit(e, (v) => ({ action: "void_payment", payload: { paymentId: v.payment, reason: v.reason } }))}><h3 className={styles.panelTitle}>Anular pago registrado por error</h3><Field label="Pago"><select className={input} name="payment" required>{s.payments.filter((p) => p.status === "activo").map((p) => <option key={p.id} value={p.id}>{p.folio}: {formatMoney(p.amount_cents)}</option>)}</select></Field><Field label="Motivo"><input className={input} name="reason" required minLength={3} /></Field><p className={styles.hint}>Reabre la deuda; no mueve piezas ni dinero bancario.</p><button className={button}>Confirmar anulación de pago</button></form>
    <form className={panel + " grid gap-3"} onSubmit={(e) => void submit(e, (v) => ({ action: "return", payload: { saleId: v.sale, void: true, reason: v.reason } }))}><h3 className={styles.panelTitle}>Anular venta equivocada</h3><Field label="Venta"><select className={input} name="sale" required>{s.sales.filter((v) => v.status === "confirmada").map((v) => <option key={v.id} value={v.id}>{v.folio}: {formatMoney(v.net_debt_cents)}</option>)}</select></Field><Field label="Motivo"><input className={input} name="reason" required minLength={3} /></Field><p className={styles.hint}>Revierte deuda y devuelve las unidades restantes a sus lotes originales.</p><button className={button}>Confirmar anulación de venta</button></form>
    <form className={panel + " grid gap-3"} onSubmit={(e) => void submit(e, (v) => { const a = s.allocations.find((a) => a.id === v.allocation); if (!a) throw new Error("Elige asignación."); return { action: "return", payload: { saleId: a.sale_id, void: false, reason: v.reason, allocations: [{ allocationId: a.id, quantity: Number(v.quantity), restock: v.restock === "si", ...(v.disposal ? { disposal: v.disposal } : {}) }] } }; })}><h3 className={styles.panelTitle}>Devolución parcial de cliente</h3><Field label="Unidades de venta / lote original"><select className={input} name="allocation" required>{s.allocations.filter((a) => a.quantity > a.returned_quantity).map((a) => <option value={a.id} key={a.id}>{s.sales.find((v) => v.id === a.sale_id)?.folio} · {s.items.find((i) => i.id === a.item_id)?.name} · {a.quantity - a.returned_quantity} × {formatMoney(a.unit_cost_cents)}</option>)}</select></Field><Field label="Cantidad"><input className={input} name="quantity" type="number" min="1" required /></Field><Field label="¿Regresa en condición vendible?"><select className={input} name="restock"><option value="si">Sí: reponer stock</option><option value="no">No: registrar destino/merma</option></select></Field><Field label="Destino si no es vendible"><input className={input} name="disposal" /></Field><Field label="Motivo"><input className={input} name="reason" minLength={3} required /></Field><button className={button}>Confirmar devolución</button></form>
    <form className={panel + " grid gap-3"} onSubmit={(e) => void submit(e, (v) => { const l = s.lots.find((l) => l.id === v.lot); if (!l) throw new Error("Elige lote."); return { action: "adjustment", payload: { itemId: l.item_id, lotId: l.id, kind: v.kind as "merma", quantity: Number(v.quantity), reason: v.reason } }; })}><h3 className={styles.panelTitle}>Retorno no vendido o merma</h3><Field label="Lote disponible"><select className={input} name="lot" required>{s.lots.filter((l) => l.available_quantity > 0).map((l) => <option value={l.id} key={l.id}>{s.items.find((i) => i.id === l.item_id)?.name} · {l.available_quantity} × {formatMoney(l.unit_cost_cents)}</option>)}</select></Field><Field label="Tipo"><select className={input} name="kind"><option value="retorno_matrixlab">Retorno a MatrixLab</option><option value="merma">Merma</option></select></Field><Field label="Cantidad"><input className={input} name="quantity" type="number" min="1" required /></Field><Field label="Motivo"><input className={input} name="reason" minLength={3} required /></Field><button className={button}>Confirmar salida sin venta</button></form>
    <form className={panel + " grid gap-3"} onSubmit={(e) => void submit(e, (v) => ({ action: "reverse_delivery", payload: { deliveryId: v.delivery, reason: v.reason } }))}><h3 className={styles.panelTitle}>Revertir entrega sin movimientos posteriores</h3><Field label="Entrega"><select className={input} name="delivery" required>{s.deliveries.filter((d) => d.status === "confirmada").map((d) => <option key={d.id} value={d.id}>{d.folio}</option>)}</select></Field><Field label="Motivo"><input className={input} name="reason" minLength={3} required /></Field><button className={button}>Confirmar reversión de entrega</button></form>
  </div>;
}

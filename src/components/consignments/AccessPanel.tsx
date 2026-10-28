"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccessSchema, type AccessCommand, type DistributorAccess } from "@/lib/consignments/access";
import s from "./portal.module.css";
const input = s.input;
const button = `${s.btn} ${s.primary}`;
const ghost = `${s.btn} ${s.ghost}`;
export default function AccessPanel({ distributorId, distributorName, csrf }: { distributorId: string; distributorName: string; csrf: string }) {
  const [accounts, setAccounts] = useState<DistributorAccess[]>([]), [action, setAction] = useState("create");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [review, setReview] = useState<AccessCommand | null>(null), [uncertain, setUncertain] = useState(false);
  const intent = useRef<{ command: AccessCommand; key: string } | null>(null), form = useRef<HTMLFormElement>(null);
  const endpoint = "/api/admin/distributors/access";
  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${endpoint}?id=${distributorId}`, { cache: "no-store" }), d = await r.json();
      if (!r.ok) throw new Error(d.error); setAccounts(d.accounts);
    } catch (e) { setError((e as Error).message); }
  }, [distributorId]);
  useEffect(() => { void refresh(); }, [refresh]);
  async function confirm() {
    if (!review) return;
    intent.current ??= { command: review, key: crypto.randomUUID() };
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf,
        "Idempotency-Key": intent.current.key }, body: JSON.stringify(intent.current.command) });
      const d = await r.json();
      if (!r.ok) {
        if (r.status < 500) { intent.current = null; setUncertain(false); setReview(null); }
        else setUncertain(true);
        throw new Error(d.error);
      }
      setNotice(`Acceso de ${review.username} guardado.`); intent.current = null; setReview(null); setUncertain(false); form.current?.reset(); await refresh();
    } catch (e) { if (intent.current) setUncertain(true); setError((e as Error).message || "Reintenta la misma confirmación."); }
    finally { setBusy(false); }
  }
  const labels: Record<string, string> = { create: "Crear cuenta", reset: "Restablecer contraseña", disable: "Suspender cuenta", enable: "Reactivar cuenta" };
  return <section className={`${s.panel} space-y-4`}>
    <h3 className={s.panelTitle}>Usuarios de {distributorName}</h3>
    <p className={s.hint}>Las cuentas que crees aquí quedan vinculadas a {distributorName} y ven automáticamente su inventario al iniciar sesión.</p>
    <p className={s.hint}>Cada usuario consulta sus piezas y registra ventas. Sólo MatrixLab administra inventario, pagos y accesos.</p>
    <p className={s.hint}>Todos usan el mismo enlace privado. El usuario identifica qué inventario corresponde.</p>
    <Link href="/distribuidores/login" className={ghost}>Abrir portal de distribuidores</Link>
    {error && <p role="alert" className={s.alert}>{error}</p>}{notice && <p role="status" className={s.notice}>{notice}</p>}
    <form ref={form} onSubmit={(e) => {
      e.preventDefault(); setError(""); const values = new FormData(e.currentTarget);
      const parsed = AccessSchema.safeParse({ distributorId, action, username: values.get("username"),
        ...(["create", "reset"].includes(action) ? { password: values.get("password") } : {}) });
      if (!parsed.success) { setError("Revisa el usuario y la contraseña (8 a 128 caracteres)."); return; }
      setReview(parsed.data);
    }}><fieldset disabled={busy || !!review} className="grid min-w-0 gap-4 md:grid-cols-2">
      <label className={s.field}>Operación<select className={input} value={action} onChange={(e) => { setAction(e.target.value); setNotice(""); }}>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className={s.field}>Usuario<input name="username" className={input} autoComplete="off" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={64} pattern="[a-z0-9][a-z0-9._-]{2,63}" /></label>
      {["create", "reset"].includes(action) && <label className={s.field}>Nueva contraseña<input name="password" type="password" className={input} autoComplete="new-password" required minLength={8} maxLength={128} /></label>}
      <button className={button}>Revisar acceso</button>
    </fieldset></form>
    {review && <div role="dialog" aria-label="Revisar acceso" className={`${s.inner} ${s.panelAccent} space-y-3`}>
      <p className="text-sm">{labels[review.action]}: <strong>{review.username}</strong>. {review.action !== "create" && "Las sesiones abiertas se cerrarán."}</p>
      {uncertain && <p className={s.hint}>La respuesta no llegó. Reintenta esta confirmación para evitar duplicados.</p>}
      <div className="flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={() => void confirm()}>{uncertain ? "Reintentar acceso" : "Confirmar acceso"}</button>
        <button className={ghost} disabled={busy || uncertain} onClick={() => setReview(null)}>Volver a editar</button></div>
    </div>}
    <div className={s.accessList}>{accounts.map((a) => <p className={s.accessRow} key={a.membership_id}><span>{a.username}</span><span className={s.accessState}>{a.is_active ? "Activo" : "Suspendido"}</span></p>)}{!accounts.length && <p className={s.hint}>Todavía no hay usuarios. Crea el acceso de este distribuidor aquí.</p>}</div>
  </section>;
}

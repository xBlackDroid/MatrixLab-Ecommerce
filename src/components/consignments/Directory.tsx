"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { distributorAdminHref } from "@/lib/consignments/navigation";
import s from "./portal.module.css";
export default function Directory({ csrf }: { csrf: string }) {
  const router = useRouter();
  const [list, setList] = useState<{ id: string; name: string; is_active: boolean }[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [intent, setIntent] = useState<{ id: string; key: string; name: string; slug: string } | null>(null);
  async function load() { try { const r = await fetch("/api/admin/distributors", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setList(d.distributors); setLoaded(true); } catch (e) { setError((e as Error).message); } }
  useEffect(() => { void load(); }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const form = e.currentTarget, values = new FormData(form);
    const v = intent ?? { id: crypto.randomUUID(), key: crypto.randomUUID(), name: String(values.get("name")), slug: String(values.get("slug")) };
    setIntent(v);
    try {
      const r = await fetch("/api/admin/distributors", { method: "POST", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf, "Idempotency-Key": v.key },
        body: JSON.stringify({ distributorId: v.id, command: { action: "distributor_create", payload: { name: v.name, slug: v.slug } } }) });
      const d = await r.json(); if (!r.ok) { if (r.status < 500) setIntent(null); throw new Error(d.error); }
      setIntent(null); form.reset(); router.push(distributorAdminHref(v.id, "piezas"));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className={s.portal}>{error && <p role="alert" className={s.alert}>{error}</p>}
    <p className={s.subtitle}>Selecciona un distribuidor para administrar las piezas que le entregas y los usuarios que verán ese inventario.</p>
    {!loaded && !error && <p role="status" className={s.hint}>Cargando distribuidores…</p>}
    <div className={s.directoryGrid}>{list.map((d) => <article className={s.panel} aria-label={`Distribuidor ${d.name}`} key={d.id}>
      <div className={s.directoryHeading}><h2 className={s.panelTitle}>{d.name}</h2><span className={s.accessState}>{d.is_active ? "Activo" : "Inactivo"}</span></div>
      <p className={s.hint + " mt-2"}>Inventario y cuentas de acceso propios.</p>
      <div className={s.directoryActions}>
        <Link className={`${s.btn} ${s.primary}`} href={distributorAdminHref(d.id)}>Administrar inventario</Link>
        <Link className={`${s.btn} ${s.ghost}`} href={distributorAdminHref(d.id, "entregas")}>Registrar entrega</Link>
        <Link className={`${s.btn} ${s.ghost}`} href={distributorAdminHref(d.id, "accesos")}>Usuarios y acceso</Link>
      </div>
    </article>)}</div>
    {loaded && !list.length && <p className={s.hint}>Agrega tu primer distribuidor. Su inventario empezará vacío.</p>}
    <form onSubmit={(e) => void create(e)} className={s.panel + " grid gap-4 md:grid-cols-3"}><h2 className={s.panelTitle + " md:col-span-3"}>Crear distribuidor</h2>
      <p className={s.hint + " md:col-span-3"}>Después de crearlo abrirás su ficha para agregar piezas, registrar entregas y crear su usuario de acceso.</p>
      <label className={s.field}>Nombre<input className={s.input} name="name" required minLength={2} maxLength={120} readOnly={!!intent} /></label>
      <label className={s.field}>Identificador<input className={s.input} name="slug" required pattern="[a-z0-9-]+" maxLength={60} placeholder="origami" readOnly={!!intent} /></label>
      <button disabled={busy} className={`${s.btn} ${s.primary} self-end`}>{busy ? "Guardando…" : intent ? "Reintentar creación" : "Crear y configurar inventario"}</button></form>
  </div>;
}

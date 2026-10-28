"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DesignProjectCard, { type AdminDesignView } from "./DesignProjectCard";
type Target = { designId: string; assetIds?: string[]; deleteProject?: boolean; resume?: boolean };
export default function DesignProjectManager({ views, csrf }: { views: AdminDesignView[]; csrf: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]), [review, setReview] = useState<Target[]>([]);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const reviewPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (review.length) { reviewPanel.current?.focus({preventScroll:true}); reviewPanel.current?.scrollIntoView({block:"start"}); }
  }, [review]);
  async function confirm() {
    setBusy(true); setError(""); setMessage("");
    let done = 0;
    try {
      for (const target of review) {
        const r = await fetch("/api/admin/designs/files", { method: "DELETE", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf }, body: JSON.stringify(target) });
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.error || "No se completó el borrado.");
        done++;
      }
      setMessage("Borrado completado: registros y archivos de Storage eliminados.");
    } catch (e) { setError(`${done ? `${done} operaciones completadas. ` : ""}${(e as Error).message}`); }
    finally { setReview([]); setSelected([]); setBusy(false); router.refresh(); }
  }
  return <div className="space-y-5">
    <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
      <p className="text-sm text-ml-white/70">Selecciona previews completos o archivos dentro de cada diseño para liberar espacio.</p>
      <button disabled={busy || !selected.length} onClick={() => setReview(selected.map(designId => ({designId,deleteProject:true})))} className="min-h-11 rounded-xl border border-ml-coral/40 px-4 py-2 text-sm font-semibold text-ml-coral disabled:opacity-40">Borrar previews seleccionados ({selected.length})</button>
    </div>
    {message && <p role="status" className="rounded-xl bg-ml-cyan/10 p-4 text-sm text-ml-cyan">{message}</p>}
    {error && <p role="alert" className="rounded-xl bg-ml-coral/10 p-4 text-sm text-ml-coral">{error}</p>}
    {!!review.length && <section ref={reviewPanel} tabIndex={-1} role="dialog" aria-modal="false" aria-label="Confirmar borrado permanente" className="scroll-mt-20 rounded-2xl border border-ml-coral/40 bg-ml-bg p-5">
      <h2 className="font-semibold">Confirmar borrado permanente</h2>
      <p className="mt-2 text-sm text-ml-white/70">Se eliminarán los archivos seleccionados de Storage y sus registros de la base de datos. Los previews completos incluyen originales, miniaturas y previews anteriores. Esta acción no se puede deshacer.</p>
      <ul className="my-4 space-y-2 break-words text-sm">{review.map(t => <li key={t.designId}>{views.find(v => v.design.id===t.designId)?.design.product_type} · {t.designId.slice(0,8)}: {t.resume ? "reanudar borrado pendiente" : t.deleteProject ? "preview completo y todos sus archivos" : views.find(v => v.design.id===t.designId)?.assets.filter(a=>t.assetIds!.includes(a.id)).map(a=>a.fileName).join(", ")}</li>)}</ul>
      <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => void confirm()} className="min-h-11 rounded-xl bg-ml-coral px-4 py-2 font-semibold text-ml-bg">{busy ? "Borrando…" : "Eliminar definitivamente"}</button>
        <button disabled={busy} onClick={() => setReview([])} className="min-h-11 rounded-xl border border-white/20 px-4 py-2">Cancelar</button></div>
    </section>}
    <fieldset disabled={busy || !!review.length} className="grid min-w-0 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {views.map(view => <DesignProjectCard key={`${view.design.id}:${view.design.updated_at}:${view.deletionPending}`} view={view} csrf={csrf} selected={selected.includes(view.design.id)}
        onSelect={checked => setSelected(v => checked ? [...v,view.design.id] : v.filter(id => id!==view.design.id))} onDelete={target => setReview([target])} />)}
    </fieldset>
  </div>;
}

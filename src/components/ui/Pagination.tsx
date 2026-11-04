"use client";
import Button from "./Button";

export default function Pagination({ page, total, pageSize, onChange, label = "Paginación" }: { page: number; total: number; pageSize: number; onChange: (page: number) => void; label?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages - 1);
  if (total <= pageSize) return null;
  return <nav aria-label={label} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-ui-text-muted" aria-live="polite">{current * pageSize + 1}–{Math.min((current + 1) * pageSize, total)} de {total}</p><div className="flex items-center gap-3"><Button variant="secondary" disabled={current === 0} onClick={() => onChange(current - 1)}>Anterior</Button><span className="ui-numeric">{current + 1} / {pages}</span><Button variant="secondary" disabled={current >= pages - 1} onClick={() => onChange(current + 1)}>Siguiente</Button></div></nav>;
}

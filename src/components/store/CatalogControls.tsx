"use client";

import { Search } from "lucide-react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/** Shared visuals; family-specific filters, quantities, units and order stay with each catalog. */
export function CatalogSearch({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative block"><span className="sr-only">{label}</span><Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ui-text-muted" /><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-md border border-ui-control-border bg-ui-surface pl-12 pr-4 text-base text-ui-text placeholder:text-ui-text-muted" /></label>; }
export function CatalogCount({ visible, total, noun }: { visible: number; total: number; noun: string }) { return <p className="ui-numeric text-sm text-ui-text-muted" role="status" aria-live="polite">{visible} de {total} {noun}</p>; }
export function CatalogEmpty({ message, onClear, clearLabel = "Limpiar búsqueda y filtros", emptyCatalog = false }: { message: string; onClear: () => void; clearLabel?: string; emptyCatalog?: boolean }) {
  return (
    <div className="mt-6">
      <EmptyState
        title={emptyCatalog ? "Aún no hay productos" : "Sin coincidencias"}
        action={emptyCatalog ? (
          <a
            href={buildWhatsAppUrl(whatsappMessages.customRequest())}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-ui-control-border px-4 py-2 text-sm font-semibold text-ui-accent transition-colors hover:bg-ui-surface-raised"
          >
            Consultar por WhatsApp
          </a>
        ) : <Button variant="secondary" onClick={onClear}>{clearLabel}</Button>}
      >
        <p>{emptyCatalog ? "Esta familia aún no tiene productos publicados. Cuéntanos qué necesitas." : message}</p>
      </EmptyState>
    </div>
  );
}

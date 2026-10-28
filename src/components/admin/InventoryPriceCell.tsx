// Celda de cliente: la renderiza `InventoryTable` ("use client"); no es un
// punto de entrada propio, por eso recibe el store y el callback como props.
import { useId, useSyncExternalStore } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { InventoryRow } from "@/lib/store/commercial-blocks";
import {
  formatInventoryPrice,
  parsePriceInput,
  priceInputValue,
  samePriceAmount,
  type InventoryPricing,
} from "@/lib/store/inventory-pricing";

const CSRF_HEADER = "x-ml-csrf";
const PRICE_ENDPOINT = "/api/admin/inventory/price";
/** Tope de espera del guardado: después se avisa que no hubo confirmación. */
const SAVE_TIMEOUT_MS = 15_000;

const SOURCE_LABEL: Record<InventoryPricing["source"], string> = {
  variant: "Precio de variante",
  base: "Hereda precio base",
  none: "Sin precio base",
};

interface PriceEditState {
  open: boolean;
  /** Texto tal cual lo escribió el admin (se conserva si el guardado falla). */
  draft: string;
  /** Texto con el que se abrió el editor: distinto de `draft` = sin guardar. */
  initial: string;
  busy: boolean;
  error: string | null;
  /**
   * Precio que el admin vio al ABRIR el editor. Es el `expectedPrice` del
   * guardado y no cambia aunque `router.refresh()` traiga datos nuevos (p. ej.
   * tras ajustar stock): si otro dispositivo cambió el precio mientras tanto,
   * la API responde 409 en vez de pisarlo. Sólo un 409 lo actualiza, después
   * de mostrar el precio vigente.
   */
  opened: InventoryPricing | null;
  /**
   * Precio confirmado por la API antes de que `router.refresh()` traiga la
   * fila nueva. Sólo se muestra mientras la fila siga con el precio leído
   * (`fromOverride`); en cuanto llegan datos frescos, mandan los datos.
   */
  confirmed: { fromOverride: number | null; pricing: InventoryPricing } | null;
}

const CLOSED: PriceEditState = {
  open: false,
  draft: "",
  initial: "",
  busy: false,
  error: null,
  opened: null,
  confirmed: null,
};

/**
 * Estado de edición por variante, fuera de React: teclear en una fila sólo
 * vuelve a pintar esa celda (no las ~1,200 filas), y el borrador sobrevive a
 * filtros y a `router.refresh()`. `busy` se marca de forma síncrona, así que
 * un doble toque nunca manda dos guardados.
 */
export class PriceEditStore {
  private states = new Map<string, PriceEditState>();
  private listeners = new Map<string, Set<() => void>>();

  get(id: string): PriceEditState {
    return this.states.get(id) ?? CLOSED;
  }

  patch(id: string, patch: Partial<PriceEditState>) {
    this.states.set(id, { ...this.get(id), ...patch });
    this.listeners.get(id)?.forEach((listener) => listener());
  }

  subscribe(id: string, listener: () => void): () => void {
    const set = this.listeners.get(id) ?? new Set();
    set.add(listener);
    this.listeners.set(id, set);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.listeners.delete(id);
    };
  }
}

function isPricing(value: unknown): value is InventoryPricing {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  const amount = (n: unknown) => n === null || (typeof n === "number" && Number.isFinite(n));
  return (
    amount(p.override) &&
    amount(p.base) &&
    amount(p.effective) &&
    (p.source === "variant" || p.source === "base" || p.source === "none")
  );
}

export function InventoryPriceCell({
  row,
  name,
  store,
  csrf,
  readOnly,
  onSaved,
}: {
  row: InventoryRow;
  /** "Producto · Variante" para etiquetas accesibles. */
  name: string;
  store: PriceEditStore;
  csrf: string;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const state = useSyncExternalStore(
    (listener) => store.subscribe(row.id, listener),
    () => store.get(row.id),
    () => store.get(row.id),
  );
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const shown =
    state.confirmed &&
    samePriceAmount(state.confirmed.fromOverride, row.pricing.override)
      ? state.confirmed.pricing
      : row.pricing;
  const dirty = state.open && state.draft !== state.initial;
  /** Lo que el editor compara y envía: el precio visto al abrirlo. */
  const editing = (state.open && state.opened) || shown;

  function open() {
    const initial = priceInputValue(shown.effective);
    store.patch(row.id, { open: true, draft: initial, initial, error: null, opened: shown });
  }

  function cancel() {
    if (store.get(row.id).busy) return;
    store.patch(row.id, { open: false, draft: "", initial: "", error: null, opened: null });
  }

  async function send(price: number | null) {
    if (store.get(row.id).busy) return;
    if (readOnly) {
      toast.info("Vista de muestra: solo lectura, no se modificó nada.");
      return;
    }
    const fromOverride = row.pricing.override;
    const expectedPrice = (store.get(row.id).opened ?? shown).override;
    store.patch(row.id, { busy: true, error: null });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SAVE_TIMEOUT_MS);
    let res: Response;
    let data: { ok?: boolean; changed?: boolean; error?: unknown; pricing?: unknown } | null;
    try {
      res = await fetch(PRICE_ENDPOINT, {
        method: "PATCH",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify({ variantId: row.id, price, expectedPrice }),
      });
      data = await res.json().catch(() => null);
    } catch {
      // Red caída o tiempo agotado: la petición pudo llegar o no. No se afirma
      // nada; el borrador y el precio esperado se conservan, así que un
      // reintento contra un precio ya cambiado termina en 409, nunca en pisarlo.
      store.patch(row.id, {
        busy: false,
        error: "No pudimos confirmar el guardado. Revisa tu conexión y el precio actual antes de reintentar.",
      });
      onSaved();
      return;
    } finally {
      clearTimeout(timer);
    }

    if (res.ok && data?.ok && isPricing(data.pricing)) {
      store.patch(row.id, {
        ...CLOSED,
        confirmed: { fromOverride, pricing: data.pricing },
      });
      toast.success(data.changed ? "Precio actualizado" : "Sin cambios en el precio");
      onSaved();
      return;
    }
    if (res.status === 409 && isPricing(data?.pricing)) {
      // Se conserva el borrador; el siguiente Guardar compara contra el
      // precio vigente, así que reemplazarlo es una decisión explícita.
      store.patch(row.id, {
        busy: false,
        opened: data.pricing,
        confirmed: { fromOverride, pricing: data.pricing },
        error: `Otro dispositivo cambió este precio a ${formatInventoryPrice(data.pricing.effective)}. Tu cambio no se guardó: revísalo y vuelve a guardar si quieres reemplazarlo.`,
      });
      onSaved();
      return;
    }
    store.patch(row.id, {
      busy: false,
      error:
        res.status === 401
          ? "Tu sesión expiró. Vuelve a iniciar sesión; el precio no se guardó."
          : typeof data?.error === "string"
            ? `${data.error} El precio no se guardó.`
            : "No pudimos guardar el precio. Intenta de nuevo.",
    });
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (store.get(row.id).busy) return;
    const parsed = parsePriceInput(store.get(row.id).draft);
    if (!parsed.ok) {
      store.patch(row.id, { error: parsed.error });
      return;
    }
    if (samePriceAmount(parsed.value, editing.effective)) {
      store.patch(row.id, { open: false, draft: "", initial: "", error: null, opened: null });
      toast.info(`Sin cambios: el precio ya es ${formatInventoryPrice(editing.effective)}.`);
      return;
    }
    void send(parsed.value);
  }

  const canUseBase = editing.source === "variant" && editing.base !== null;

  // Fragmento: en la tarjeta móvil la celda es flex con salto de línea, así
  // el editor baja a una fila propia de ancho completo.
  return (
    <>
      <span className="flex min-w-0 flex-col items-end gap-1 sm:items-start">
        <span
          data-testid="inventory-price"
          className={
            shown.effective === null
              ? "whitespace-nowrap text-sm text-ml-white/45"
              : "whitespace-nowrap font-semibold tabular-nums"
          }
        >
          {formatInventoryPrice(shown.effective)}
        </span>
        <span
          data-testid="inventory-price-source"
          className="whitespace-nowrap text-xs text-ml-white/45"
        >
          {SOURCE_LABEL[shown.source]}
        </span>
        {!state.open && (
          <button
            type="button"
            onClick={open}
            aria-label={`Editar precio de ${name}`}
            className="min-h-11 whitespace-nowrap rounded-full border border-white/15 px-4 text-sm text-ml-white/80 transition hover:border-ml-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet sm:min-h-8 sm:px-3 sm:text-xs pointer-coarse:min-h-11 pointer-coarse:px-4 pointer-coarse:text-sm"
          >
            Editar precio
          </button>
        )}
      </span>
      {state.open && (
        <form
          onSubmit={save}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancel();
          }}
          noValidate
          aria-label={`Precio de ${name}`}
          data-testid="inventory-price-editor"
          className="mt-2 flex w-full flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left max-sm:mt-0 max-sm:basis-full sm:w-60"
        >
          <label htmlFor={inputId} className="text-xs font-semibold uppercase text-ml-white/55">
            Nuevo precio (MXN)
          </label>
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-ml-white/55">$</span>
            <input
              id={inputId}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              // El admin pidió editar: llevarlo directo al campo.
              autoFocus
              value={state.draft}
              readOnly={state.busy}
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? `${hintId} ${errorId}` : hintId}
              onChange={(event) =>
                store.patch(row.id, { draft: event.target.value, error: null })
              }
              placeholder="0.00"
              className="min-h-11 w-full min-w-0 rounded-lg border border-white/15 bg-ml-bg px-3 text-base tabular-nums outline-none transition [color-scheme:dark] focus:border-ml-violet aria-[invalid=true]:border-ml-coral"
            />
          </span>
          <span id={hintId} className="text-xs text-ml-white/50">
            Solo cambia esta variante ({row.title}).
            {editing.base !== null && ` Precio base: ${formatInventoryPrice(editing.base)}.`}
            {dirty && <span className="text-ml-cyan"> Sin guardar.</span>}
          </span>
          {state.error && (
            <p id={errorId} role="alert" className="text-sm text-ml-coral">
              {state.error}
            </p>
          )}
          <span className="flex gap-2">
            <button
              type="submit"
              disabled={state.busy}
              aria-busy={state.busy || undefined}
              aria-disabled={readOnly || undefined}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-ml-violet px-4 text-sm font-semibold text-white transition hover:bg-ml-violet/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet disabled:opacity-60"
            >
              {state.busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {state.busy ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={state.busy}
              className="min-h-11 flex-1 rounded-full border border-white/15 px-4 text-sm text-ml-white/80 transition hover:border-ml-violet focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet disabled:opacity-50"
            >
              Cancelar
            </button>
          </span>
          {canUseBase && (
            <button
              type="button"
              onClick={() => void send(null)}
              disabled={state.busy}
              aria-disabled={readOnly || undefined}
              className="min-h-11 rounded-full border border-white/10 px-4 text-sm text-ml-white/70 transition hover:border-ml-cyan/50 hover:text-ml-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-violet disabled:opacity-50"
            >
              Usar precio base ({formatInventoryPrice(editing.base)})
            </button>
          )}
        </form>
      )}
    </>
  );
}

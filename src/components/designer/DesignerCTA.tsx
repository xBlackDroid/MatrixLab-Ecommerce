"use client";

import { Loader2, MessageCircle, Save, ShoppingBag } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

interface DesignerCTAProps {
  canSave: boolean;
  canAddToCart: boolean;
  saving: boolean;
  addingToCart: boolean;
  saved: boolean;
  designId: string | null;
  onSave: () => void;
  onAddToCart: () => void;
}

/** Acciones finales del diseñador. */
export default function DesignerCTA({
  canSave,
  canAddToCart,
  saving,
  addingToCart,
  saved,
  designId,
  onSave,
  onAddToCart,
}: DesignerCTAProps) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onAddToCart}
        disabled={!canAddToCart || addingToCart}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-cyan px-6 py-4 font-semibold text-ml-bg shadow-glow-cyan transition hover:bg-ml-cyan/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {addingToCart ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="h-5 w-5" aria-hidden />
        )}
        Agregar diseño al carrito
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-violet/40 bg-ml-violet/10 px-6 py-3.5 font-semibold text-ml-violet transition hover:bg-ml-violet/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Save className="h-5 w-5" aria-hidden />
        )}
        {saved ? "Diseño guardado ✓" : "Guardar diseño"}
      </button>

      <a
        href={buildWhatsAppUrl(
          designId
            ? whatsappMessages.design(designId)
            : whatsappMessages.quoteDesign(),
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-ml-white/85 transition hover:border-white/30"
      >
        <MessageCircle className="h-4.5 w-4.5" aria-hidden />
        Prefiero cotizar por WhatsApp
      </a>
    </div>
  );
}

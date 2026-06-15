import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/** Aviso del laboratorio láser (estructura base, sin producción avanzada). */
export default function LaserDisclaimer() {
  return (
    <div className="glass mt-6 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm text-ml-white/65">
        Esta es una vista de referencia sobre la plantilla elegida. El área
        segura representa el espacio recomendado para tu grabado. Si quieres
        confirmar materiales, medidas o un acabado especial, escríbenos por
        WhatsApp y lo cotizamos contigo.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.laserQuote())}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-ml-white/85 transition hover:border-ml-cyan/40 hover:text-ml-cyan"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Cotizar por WhatsApp
      </a>
    </div>
  );
}

import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/** Aviso de producción para planillas de stickers/imanes. */
export default function SheetDisclaimer() {
  return (
    <div className="glass mt-6 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm text-ml-white/65">
        La producción se realiza en hoja tamaño carta. El área visible del
        lienzo representa el área imprimible segura. Si no sabes cómo acomodar
        tus imágenes o quieres una planilla más personalizada, escríbenos por
        WhatsApp y te ayudamos.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.sheetHelp())}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-ml-white/85 transition hover:border-ml-cyan/40 hover:text-ml-cyan"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Ayuda por WhatsApp
      </a>
    </div>
  );
}

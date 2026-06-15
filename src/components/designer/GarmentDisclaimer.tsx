import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/** Aviso de calidad + ayuda por WhatsApp, debajo del diseñador de prendas. */
export default function GarmentDisclaimer() {
  return (
    <div className="glass mt-6 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-2xl text-sm text-ml-white/65">
        La calidad final dependerá directamente de la imagen que subas. Para
        mejores resultados usa archivos PNG de alta resolución y sin fondo. Si
        no logras acomodar tu diseño como quieres, o no sabes qué archivo subir,
        escríbenos por WhatsApp y te ayudamos a prepararlo.
      </p>
      <a
        href={buildWhatsAppUrl(whatsappMessages.designHelp())}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-ml-white/85 transition hover:border-ml-cyan/40 hover:text-ml-cyan"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Necesito ayuda por WhatsApp
      </a>
    </div>
  );
}

import { ArrowRight, MessageCircle } from "lucide-react";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/** CTA final de la tienda: pedidos especiales por WhatsApp. */
export default function StoreCTA() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-3xl p-10 text-center sm:p-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-ml-coral/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-ml-violet/15 blur-3xl" />
        <h2 className="relative text-3xl font-bold sm:text-4xl">
          ¿No ves lo que necesitas?{" "}
          <span className="text-gradient">Podemos crearlo.</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-ml-white/65">
          Cuéntanos tu idea: piezas únicas, regalos, pedidos para eventos o
          producción por volumen para tu empresa.
        </p>
        <a
          href={buildWhatsAppUrl(whatsappMessages.customRequest())}
          target="_blank"
          rel="noopener noreferrer"
          className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-ml-coral px-8 py-4 font-semibold text-ml-bg transition hover:scale-[1.02] hover:bg-ml-coral/90"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          Pregúntanos por WhatsApp
          <ArrowRight className="h-5 w-5" aria-hidden />
        </a>
      </div>
    </section>
  );
}

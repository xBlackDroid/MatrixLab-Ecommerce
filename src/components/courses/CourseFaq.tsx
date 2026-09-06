import { ChevronDown, MessageCircle } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { SparkleMark } from "@/components/icons/CourseDecor";
import type { CourseFaqItem } from "@/lib/store/courses/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Preguntas frecuentes.
 *
 * Se usa `<details>`/`<summary>` NATIVO y no un acordeón con estado: funciona
 * sin JavaScript, el teclado y los lectores de pantalla ya saben usarlo, y no
 * añade un solo byte al bundle del cliente (esta sección se renderiza en el
 * servidor). Un acordeón hecho a mano tendría que reimplementar
 * `aria-expanded`, el foco y la tecla Enter para quedar igual de bien.
 *
 * Todas las respuestas viven en los datos de la edición: cambiar el copy de
 * "¿Incluye materiales?" cuando se confirme qué incluye el precio es editar
 * una línea en `matrixlab-tumbler.ts`, sin tocar este archivo.
 */
export default function CourseFaq({ items }: { items: CourseFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section
      id="preguntas"
      className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ml-violet">
              Antes de apuntarte
            </span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]">
              Preguntas <span className="text-gradient">frecuentes</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-9 space-y-3">
          {items.map((item, index) => (
            <Reveal key={item.question} delay={(index % 3) * 0.05}>
              <details className="group overflow-hidden rounded-2xl border border-ml-white/10 bg-ml-white/[0.04] backdrop-blur-[14px] transition hover:border-ml-violet/35 open:border-ml-violet/35">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ml-white sm:px-6 sm:py-5 sm:text-lg">
                  <span className="flex min-w-0 items-center gap-3">
                    <SparkleMark
                      className="h-4 w-4 shrink-0 text-ml-violet opacity-70"
                      aria-hidden
                    />
                    {item.question}
                  </span>
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-ml-white/50 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-ml-white/70 sm:px-6 sm:pb-6 sm:pl-14 sm:text-base">
                  {item.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-8 text-center">
            <p className="text-sm text-ml-white/55">
              ¿Te quedó otra duda? Pregúntanos directo, sin compromiso.
            </p>
            <a
              href={buildWhatsAppUrl(
                "Hola MatrixLab, tengo una duda sobre el taller Cursos MatrixLab Tumbler.",
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-ml-green px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-green/90"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Preguntar por WhatsApp
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

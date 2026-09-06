import { ExternalLink, MessageCircle } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { PlayMark, SparkleMark } from "@/components/icons/CourseDecor";
import { safeCourseVideos } from "@/lib/store/courses";
import type { CourseVideo } from "@/lib/store/courses/types";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * "Mira lo que hacemos": vistas previas de los videos de TikTok / redes.
 *
 * NO HAY REPRODUCTOR INCRUSTADO, y es a propósito. El embed de TikTok exige
 * `frame-src https://www.tiktok.com` y cargar su script desde su dominio; la
 * CSP del sitio declara `frame-src 'none'` y `script-src 'self' 'nonce-…'
 * 'strict-dynamic'`. Abrir esas dos puertas metería un script y un iframe de
 * terceros en la MISMA página donde vive el formulario que recoge nombre,
 * teléfono y correo. La CSP no se toca: cada video es una tarjeta que abre el
 * enlace en una pestaña nueva.
 *
 * Los enlaces se filtran por host (`safeCourseVideos`): sólo https y sólo
 * dominios de video conocidos.
 */

const PLACEHOLDER_TONES = [
  { badge: "bg-ml-violet/15", text: "text-ml-violet" },
  { badge: "bg-ml-cyan/15", text: "text-ml-cyan" },
  { badge: "bg-ml-coral/15", text: "text-ml-coral" },
] as const;

export default function CourseVideos({ videos }: { videos: CourseVideo[] }) {
  const safe = safeCourseVideos(videos);

  return (
    <section
      id="videos"
      className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ml-cyan">
              En movimiento
            </span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]">
              Mira lo que <span className="text-gradient">hacemos</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ml-white/70">
              {safe.length > 0
                ? "Videos cortos del taller y de los proyectos que salen de él."
                : "Estamos subiendo los videos del taller. Mientras tanto, pídenos el último por WhatsApp."}
            </p>
          </div>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {safe.length > 0
            ? safe.map((video, index) => (
                <Reveal key={video.url} delay={(index % 3) * 0.07} className="h-full">
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-ml-white/10 bg-ml-white/[0.04] p-6 backdrop-blur-[14px] transition duration-300 hover:-translate-y-0.5 hover:border-ml-cyan/50"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-cyan/15 via-transparent to-ml-violet/10"
                      aria-hidden
                    />
                    <PlayMark
                      className="pointer-events-none absolute -bottom-8 -right-6 h-36 w-36 text-ml-cyan opacity-[0.09] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.16]"
                      aria-hidden
                    />

                    <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-ml-cyan/15 text-ml-cyan">
                      <PlayMark className="h-7 w-7" aria-hidden />
                    </span>

                    <span className="relative mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ml-white/45">
                      {video.platform}
                    </span>
                    <h3 className="relative mt-1.5 text-lg font-bold leading-snug text-ml-white">
                      {video.label}
                    </h3>

                    <span className="relative mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-ml-cyan transition group-hover:gap-3">
                      Ver en {video.platform}
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      {/* Se avisa que sale del sitio: abrir una pestaña sin
                          previo aviso es de las cosas que más desorientan. */}
                      <span className="sr-only">(se abre en una pestaña nueva)</span>
                    </span>
                  </a>
                </Reveal>
              ))
            : PLACEHOLDER_TONES.map((tone, index) => (
                <Reveal key={index} delay={index * 0.07} className="h-full">
                  <div
                    aria-hidden
                    className="relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-[1.5rem] border border-dashed border-ml-white/12 bg-ml-white/[0.02] p-6"
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.badge} ${tone.text} opacity-60`}
                    >
                      <PlayMark className="h-7 w-7" aria-hidden />
                    </span>
                    <SparkleMark
                      className={`absolute right-6 top-6 h-4 w-4 opacity-25 ${tone.text}`}
                    />
                    <p className="mt-6 text-sm text-ml-white/40">
                      Video próximamente
                    </p>
                  </div>
                </Reveal>
              ))}
        </div>

        {safe.length === 0 && (
          <Reveal delay={0.1}>
            <div className="mt-7 flex justify-center">
              <a
                href={buildWhatsAppUrl(
                  "Hola MatrixLab, quiero ver videos del taller Cursos MatrixLab Tumbler.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ml-green/40 bg-ml-green/10 px-6 py-3 font-semibold text-ml-green transition hover:bg-ml-green/20"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                Pídenos ver el taller
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

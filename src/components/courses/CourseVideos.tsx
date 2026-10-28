import { ExternalLink, MessageCircle } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { PlayMark } from "@/components/icons/CourseDecor";
import { safeCourseVideos } from "@/lib/store/courses";
import type { CourseVideo } from "@/lib/store/courses/types";
import type { LocalCourseVideo } from "@/lib/store/courses/local-videos";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/** Reproductores propios y TikTok aislado en iframe, sin scripts externos. */
export default function CourseVideos({
  videos,
  localVideos = [],
}: {
  videos: CourseVideo[];
  localVideos?: LocalCourseVideo[];
}) {
  const safe = safeCourseVideos(videos);
  const hasMedia = safe.length > 0 || localVideos.length > 0;

  return (
    <section id="videos" className="relative scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ml-cyan">En movimiento</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]">
              Mira lo que <span className="text-gradient">hacemos</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ml-white/70">
              {hasMedia ? "Momentos del taller y proyectos Tumbler y SnowGlobe. Dale play para verlos de cerca." : "Pídenos el último video del taller por WhatsApp."}
            </p>
          </div>
        </Reveal>

        {localVideos.length > 0 && (
          <div className="mt-9">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-semibold">Desde el taller</h3>
              <p className="text-sm text-ml-white/50">Desliza para ver los {localVideos.length} videos</p>
            </div>
            <div tabIndex={0} role="group" aria-label="Videos del taller" className="flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-xl pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ml-cyan sm:gap-5">
              {localVideos.map((video) => (
                <figure key={video.src} className="w-[min(78vw,18rem)] shrink-0 snap-start">
                  <div className="aspect-[9/16] overflow-hidden rounded-2xl border border-ml-white/10 bg-black/40">
                    <video controls muted playsInline preload="none" poster={video.poster} width={video.width} height={video.height} aria-label={video.label} className="h-full w-full object-contain">
                      <source src={video.src} type="video/mp4" />
                      Tu navegador no puede reproducir este video. <a href={video.src}>Abrir video</a>
                    </video>
                  </div>
                  <figcaption className="mt-3 text-sm text-ml-white/65">{video.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {safe.length > 0 && (
          <div className="mt-10">
            <h3 className="mb-5 text-lg font-semibold">También en TikTok</h3>
            <div className="grid grid-cols-1 justify-items-center gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {safe.map((video) => (
                <article key={video.url} className="w-full max-w-[20rem] min-w-0">
                  <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-ml-white/10 bg-black/40">
                    {video.embedUrl ? (
                      <iframe src={video.embedUrl} title={video.label} loading="lazy" allow="fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="absolute inset-0 h-full w-full border-0" />
                    ) : (
                      <a href={video.url} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${video.label} en ${video.platform}`} className="flex h-full items-center justify-center text-ml-cyan transition hover:bg-ml-cyan/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ml-cyan">
                        <PlayMark className="h-16 w-16" aria-hidden />
                      </a>
                    )}
                  </div>
                  <h4 className="mt-3 text-sm font-medium text-ml-white/85">{video.label}</h4>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 rounded text-sm text-ml-cyan underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ml-cyan">
                    Ver en {video.platform}<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only"> (se abre en una pestaña nueva)</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        )}

        {!hasMedia && (
          <a href={buildWhatsAppUrl("Hola MatrixLab, quiero ver videos del taller Cursos MatrixLab Tumbler.")} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-full border border-ml-green/40 bg-ml-green/10 px-6 py-3 font-semibold text-ml-green transition hover:bg-ml-green/20">
            <MessageCircle className="h-5 w-5" aria-hidden />Pídenos ver el taller
          </a>
        )}
      </div>
    </section>
  );
}

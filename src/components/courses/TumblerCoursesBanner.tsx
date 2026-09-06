import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, Ticket } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import {
  SnowGlobeArt,
  SparkleMark,
  TumblerArt,
} from "@/components/icons/CourseDecor";
import {
  COURSE_REGISTRATION_ANCHOR,
  formatCoursePrice,
  getFeaturedEdition,
  MATRIXLAB_TUMBLER_COURSE,
} from "@/lib/store/courses";

/**
 * Bloque de CURSOS dentro de /tienda/categoria/matrixlab-tumbler.
 *
 * Va DEBAJO de la grilla de subcategorías y NO debe leerse como una séptima
 * tarjeta: las seis de arriba son *estanterías* (líneas de producto) y esto es
 * una *experiencia con fecha y cupo*. Lo que lo separa visualmente:
 *
 *   - Ancho completo, no una celda de la retícula de tres.
 *   - Tratamiento "aurora": el degradado cruza violeta → cian → coral en vez
 *     del acento único que lleva cada tarjeta de línea.
 *   - Jerarquía editorial (insignia, titular grande, ficha de datos aparte)
 *     en lugar del bloque icono + título + párrafo.
 *   - Ornamentos propios y watermark grande de vaso, dibujado a mano
 *     (`CourseDecor`), no un icono de librería.
 *
 * Todo el contenido sale de `MATRIXLAB_TUMBLER_COURSE`: publicar la Edición 3
 * no toca este archivo.
 */
export default function TumblerCoursesBanner() {
  const course = MATRIXLAB_TUMBLER_COURSE;
  const edition = getFeaturedEdition(course);
  const registerHref = `${course.href}#${COURSE_REGISTRATION_ANCHOR}`;

  return (
    <Reveal className="mt-10">
      <section
        aria-labelledby="cursos-tumbler-titulo"
        className="group relative overflow-hidden rounded-[1.75rem] border border-ml-white/10 bg-ml-white/[0.04] p-6 backdrop-blur-[14px] transition duration-300 hover:border-ml-violet/40 sm:rounded-[2.25rem] sm:p-9 lg:p-11"
      >
        {/* --- Fondo: aurora + manchas + retícula ------------------------ */}
        {/* El degradado CRUZA los tres acentos. Es lo que dice "esto no es
            otra línea de producto" antes de leer una sola palabra. */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-violet/20 via-ml-cyan/[0.07] to-ml-coral/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-ml-violet/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-28 right-4 h-56 w-56 rounded-full bg-ml-coral/20 blur-3xl"
          aria-hidden
        />
        <div
          className="grid-overlay pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
        />

        {/* --- Watermarks propios ---------------------------------------- */}
        {/* El vaso desborda la esquina inferior derecha: es la pieza que cada
            persona se lleva del taller. `hidden sm:block` porque a 390px
            competiría con el texto en vez de acompañarlo. */}
        <TumblerArt
          className="pointer-events-none absolute -bottom-14 -right-10 hidden h-64 w-64 text-ml-violet opacity-[0.09] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.15] sm:block lg:h-80 lg:w-80"
          aria-hidden
        />
        <SnowGlobeArt
          className="pointer-events-none absolute -left-12 bottom-2 hidden h-44 w-44 text-ml-cyan opacity-[0.07] lg:block"
          aria-hidden
        />
        <SparkleMark
          className="pointer-events-none absolute right-10 top-6 h-6 w-6 text-ml-cyan opacity-40"
          aria-hidden
        />
        <SparkleMark
          className="pointer-events-none absolute right-24 top-16 h-3.5 w-3.5 text-ml-coral opacity-30"
          aria-hidden
        />

        {/* --- Contenido -------------------------------------------------- */}
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
          <div className="min-w-0 lg:flex-1">
            <span className="inline-flex items-center gap-2 rounded-full border border-ml-violet/30 bg-ml-violet/10 px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ml-violet">
              <SparkleMark className="h-3.5 w-3.5" aria-hidden />
              {edition.badge}
            </span>

            <h2
              id="cursos-tumbler-titulo"
              className="mt-4 text-[1.75rem] font-bold leading-[1.1] sm:text-4xl"
            >
              Cursos <span className="text-gradient">MatrixLab Tumbler</span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ml-white/70 sm:text-base">
              {edition.pitch}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={course.href}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-7 py-3.5 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:scale-[1.02] hover:bg-ml-violet/90"
              >
                Ver curso
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <Link
                href={registerHref}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ml-white/20 bg-ml-white/[0.06] px-7 py-3.5 text-base font-semibold text-ml-white transition hover:border-ml-coral/50 hover:text-ml-coral"
              >
                <Ticket className="h-5 w-5" aria-hidden />
                Quiero mi lugar
              </Link>
            </div>
          </div>

          {/* Ficha de datos: sede, precio y edición como DATOS, no como
              párrafo. Es lo que alguien busca cuando ya decidió que le
              interesa, y por eso vive en su propio panel. */}
          <div className="w-full shrink-0 rounded-[1.5rem] border border-ml-white/12 bg-ml-bg/40 p-5 sm:p-6 lg:w-[19.5rem]">
            <dl className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ml-coral/15 text-ml-coral">
                  <MapPin className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ml-white/45">
                    Sede
                  </dt>
                  <dd className="text-sm font-semibold text-ml-white">
                    {edition.venue.name}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ml-green/15 text-ml-green">
                  <Ticket className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ml-white/45">
                    Inversión
                  </dt>
                  <dd className="text-xl font-bold leading-tight text-ml-green">
                    {formatCoursePrice(edition.priceMxn)}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ml-cyan/15 text-ml-cyan">
                  <CalendarClock className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ml-white/45">
                    Sondeo de fecha
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {edition.dateOptions.map((option) => (
                      <span
                        key={option.value}
                        className="rounded-full border border-ml-cyan/30 bg-ml-cyan/10 px-2.5 py-1 text-xs font-semibold text-ml-cyan"
                      >
                        {option.label}
                      </span>
                    ))}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </Reveal>
  );
}

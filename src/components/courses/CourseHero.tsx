import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarClock, MapPin } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { SoftBlob } from "@/components/icons/BrandDecor";
import {
  SnowGlobeArt,
  SparkleMark,
  TumblerArt,
} from "@/components/icons/CourseDecor";
import { formatCoursePrice } from "@/lib/store/courses";
import type { Course, CourseEdition } from "@/lib/store/courses/types";

/**
 * Hero de la landing del curso.
 *
 * PRIORIDAD DEL CONTENIDO (el público es muy visual y decide rápido): qué es,
 * cuánto cuesta, dónde y cuándo — y un botón enorme. Todo lo demás va abajo.
 *
 * El precio, la sede y el sondeo de fecha viven en un panel aparte y no dentro
 * del párrafo: alguien que ya sabe que le interesa no debería tener que leer
 * una frase entera para encontrar los $2,500.
 */
export default function CourseHero({
  course,
  edition,
  registerHref,
}: {
  course: Course;
  edition: CourseEdition;
  registerHref: string;
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-4 pt-8 sm:px-6 sm:pt-10">
      {/* Fondo del hero: manchas orgánicas + retícula. Ninguna imagen: el
          taller todavía no tiene fotos y una foto de banco mentiría. */}
      <SoftBlob
        className="pointer-events-none absolute -left-40 -top-24 h-[26rem] w-[26rem] text-ml-violet/[0.10] blur-2xl"
        aria-hidden
      />
      <SoftBlob
        className="pointer-events-none absolute -right-44 top-20 h-[30rem] w-[30rem] text-ml-coral/[0.08] blur-2xl"
        aria-hidden
      />
      <div
        className="grid-overlay pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <Link
          href={course.categoryHref}
          className="inline-flex items-center gap-1.5 text-sm text-ml-white/60 transition hover:text-ml-violet"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a MatrixLab Tumbler
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-12">
          {/* ---------------- Columna de mensaje ---------------- */}
          <Reveal>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-ml-violet/30 bg-ml-violet/10 px-4 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ml-violet">
                <SparkleMark className="h-3.5 w-3.5" aria-hidden />
                {edition.badge}
              </span>

              <h1 className="mt-5 text-[2.1rem] font-bold leading-[1.06] sm:text-5xl lg:text-[3.4rem]">
                Cursos <span className="text-gradient">MatrixLab Tumbler</span>
              </h1>

              {/* La edición como ETIQUETA grande y no como texto pequeño: es
                  la señal de "esto es una convocatoria, no un catálogo". */}
              <p className="mt-4 inline-flex items-center gap-2.5 rounded-2xl border border-ml-cyan/25 bg-ml-cyan/[0.08] px-4 py-2 text-lg font-bold text-ml-cyan sm:text-xl">
                <SparkleMark className="h-4 w-4" aria-hidden />
                {edition.hero.subtitle}
              </p>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-ml-white/75 sm:text-lg">
                {edition.hero.copy}
              </p>

              {/* CTA enorme: en móvil ocupa todo el ancho. Es la acción que
                  esta página existe para provocar. */}
              <Link
                href={registerHref}
                className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ml-coral px-8 py-4 text-lg font-bold text-ml-bg shadow-glow-coral transition hover:scale-[1.02] hover:bg-ml-coral/90 sm:w-auto sm:px-10"
              >
                {edition.hero.cta}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>

              <p className="mt-3 text-sm text-ml-white/50">
                Sin pago en línea: apartas tu lugar y te confirmamos por
                WhatsApp.
              </p>
            </div>
          </Reveal>

          {/* ---------------- Panel de datos ---------------- */}
          <Reveal delay={0.08}>
            <div className="relative overflow-hidden rounded-[2rem] border border-ml-white/12 bg-ml-white/[0.05] p-6 backdrop-blur-[14px] sm:p-8">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-violet/15 via-transparent to-ml-cyan/10"
                aria-hidden
              />
              <TumblerArt
                className="pointer-events-none absolute -bottom-10 -right-8 h-48 w-48 text-ml-violet opacity-[0.12]"
                aria-hidden
              />
              <SnowGlobeArt
                className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 text-ml-cyan opacity-[0.10]"
                aria-hidden
              />

              <div className="relative">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ml-white/45">
                  Tu lugar
                </p>
                <p className="mt-1 text-4xl font-bold leading-none text-ml-green sm:text-[2.75rem]">
                  {formatCoursePrice(edition.priceMxn)}
                </p>

                <dl className="mt-7 space-y-5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ml-coral/15 text-ml-coral">
                      <MapPin className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ml-white/45">
                        Dónde
                      </dt>
                      <dd className="text-base font-semibold text-ml-white">
                        {edition.venue.name}
                      </dd>
                      <dd className="text-sm text-ml-white/55">
                        {edition.venue.city}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ml-cyan/15 text-ml-cyan">
                      <CalendarClock className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ml-white/45">
                        Cuándo
                      </dt>
                      {/* Se dice EN SONDEO, no una fecha cerrada: todavía no
                          lo está, y prometerla sería lo primero que habría
                          que desdecir por WhatsApp. */}
                      <dd className="text-base font-semibold text-ml-white">
                        {edition.datePollLabel}
                      </dd>
                      <dd className="mt-2 flex flex-wrap gap-1.5">
                        {edition.dateOptions.map((option) => (
                          <span
                            key={option.value}
                            className="rounded-full border border-ml-cyan/30 bg-ml-cyan/10 px-3 py-1 text-xs font-semibold text-ml-cyan"
                          >
                            {option.label}
                          </span>
                        ))}
                      </dd>
                    </div>
                  </div>
                </dl>

                <p className="mt-6 text-sm leading-relaxed text-ml-white/55">
                  Tu preferencia de fecha nos ayuda a elegir el día.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

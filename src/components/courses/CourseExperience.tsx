import Reveal from "@/components/landing/Reveal";
import { SoftBlob } from "@/components/icons/BrandDecor";
import { COURSE_ART, SparkleMark } from "@/components/icons/CourseDecor";
import { COURSE_ACCENTS } from "@/components/courses/accents";
import type { CourseExperienceItem } from "@/lib/store/courses/types";

/**
 * "Qué vas a vivir": la composición que explica el taller.
 *
 * NO es una retícula de tarjetas iguales con un iconito cada una. Esa forma
 * —seis cajas idénticas de 4rem con un pictograma de librería— es exactamente
 * lo que hace que una página de curso parezca una plantilla, y además reparte
 * el mismo peso visual a todo, así que no dice qué es lo importante.
 *
 * Aquí la composición tiene RITMO:
 *
 *   - Un bloque protagonista que ocupa el doble y lleva el dibujo a tamaño de
 *     ilustración. Es la promesa que de verdad vende el taller ("te vas con tu
 *     pieza"), y se ve antes que el resto.
 *   - Bloques medianos y pequeños alternando ancho, con acentos distintos.
 *   - Una franja ancha al final para cerrar (la comunidad).
 *   - Dibujos PROPIOS (`CourseDecor`) usados como watermark que desborda la
 *     esquina, no como icono decorativo dentro de un cuadrito.
 */

/**
 * Ritmo de la composición: cuántas columnas ocupa cada bloque en escritorio.
 * El índice es la posición en `experience`. Cambiar el orden de los datos
 * cambia la composición, que es justo lo que se quiere: el contenido manda.
 */
const SPANS = [
  "sm:col-span-2 lg:col-span-3 lg:row-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "sm:col-span-2 lg:col-span-6",
] as const;

/** Bloques extra (una edición futura con más puntos) caen en el tamaño medio. */
const DEFAULT_SPAN = "lg:col-span-2";

export default function CourseExperience({
  items,
}: {
  items: CourseExperienceItem[];
}) {
  return (
    <section
      id="experiencia"
      className="relative scroll-mt-24 overflow-hidden px-4 py-16 sm:px-6 sm:py-20"
    >
      <SoftBlob
        className="pointer-events-none absolute -left-48 top-24 h-[32rem] w-[32rem] text-ml-violet/[0.07] blur-2xl"
        aria-hidden
      />
      <SoftBlob
        className="pointer-events-none absolute -right-52 bottom-0 h-[34rem] w-[34rem] text-ml-cyan/[0.06] blur-2xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ml-coral">
              La experiencia
            </span>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-[2.5rem]">
              Qué vas a vivir en el{" "}
              <span className="text-gradient">taller</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ml-white/70">
              Una sesión práctica, visual y guiada. Llegas sin saber nada y te
              vas con tu proyecto en las manos.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-6">
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              // El retraso se reinicia cada tres bloques: escalonar los siete
              // seguidos haría que el último entrara casi medio segundo tarde,
              // y para entonces ya está en pantalla.
              delay={(index % 3) * 0.07}
              className={`${SPANS[index] ?? DEFAULT_SPAN} h-full`}
            >
              <ExperienceBlock item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceBlock({ item }: { item: CourseExperienceItem }) {
  const accent = COURSE_ACCENTS[item.accent];
  const Art = COURSE_ART[item.art];

  return (
    <article
      /* Utilidades sueltas en vez de `.glass`: el borde de esa clase no lleva
         capa y ganaría en la cascada sobre el `hover:border-*` del bloque, así
         que el hover nunca se vería. */
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-ml-white/10 bg-ml-white/[0.04] p-6 backdrop-blur-[14px] transition duration-300 hover:-translate-y-0.5 sm:rounded-[1.75rem] ${
        item.featured ? "sm:p-8 lg:p-10" : "sm:p-7"
      } ${accent.hoverBorder}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.gradient}`}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl ${accent.orb}`}
        aria-hidden
      />
      {/* Watermark: el dibujo del bloque, enorme y desbordando la esquina.
          En el protagonista es casi el doble de grande. */}
      <Art
        className={`pointer-events-none absolute -bottom-8 -right-6 ${accent.text} opacity-[0.09] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.16] ${
          item.featured ? "h-56 w-56 lg:h-72 lg:w-72" : "h-36 w-36"
        }`}
        aria-hidden
      />

      <span
        className={`relative flex items-center justify-center rounded-2xl ${accent.badge} ${accent.text} ${
          item.featured ? "h-16 w-16" : "h-12 w-12"
        }`}
      >
        <Art className={item.featured ? "h-9 w-9" : "h-7 w-7"} aria-hidden />
      </span>

      <h3
        className={`relative mt-5 font-bold leading-tight text-ml-white ${
          item.featured ? "text-2xl sm:text-[1.8rem]" : "text-lg"
        }`}
      >
        {item.title}
      </h3>
      <p
        className={`relative mt-2.5 leading-relaxed text-ml-white/70 ${
          item.featured ? "text-base sm:text-lg" : "text-sm"
        }`}
      >
        {item.description}
      </p>

      {item.featured && (
        <SparkleMark
          className={`pointer-events-none absolute right-8 top-8 h-5 w-5 opacity-40 ${accent.text}`}
          aria-hidden
        />
      )}
    </article>
  );
}

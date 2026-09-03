import type { ComponentType, SVGProps } from "react";
import type { CourseArtKey } from "@/lib/store/courses/types";

/**
 * Dibujos propios de los Cursos MatrixLab Tumbler.
 *
 * POR QUÉ NO SON ICONOS DE LIBRERÍA
 * ---------------------------------
 * Un taller de vasos y SnowGlobes no se cuenta con `GraduationCap`,
 * `Lightbulb` y `Users`: esos dicen "curso genérico" y podrían ilustrar
 * igual de bien un webinar de contabilidad. Lo que se vende aquí es un vaso
 * con purpurina flotando, una jarra de glitter y un pincel en la mano, así
 * que eso es lo que se dibuja.
 *
 * Mismo criterio técnico que `BrandDecor` y `ApparelSilhouettes`:
 *
 * - Lienzo 64×64 (ilustración, no icono de 24px): admite detalle real cuando
 *   la figura se usa como watermark de 14rem.
 * - Todo en `currentColor`, SIN `<linearGradient>` interno. Cada figura se
 *   pinta dos veces por bloque —insignia pequeña y watermark gigante— y dos
 *   IDs de degradado iguales en el mismo documento hacen que el navegador
 *   resuelva el equivocado. El color y el brillo se ponen desde CSS, que
 *   además los hace animables en hover.
 * - El trazo ESCALA con la figura (nada de `vectorEffect="non-scaling-stroke"`):
 *   un watermark de 14rem con el pelo de 2px fijo, al 8 % de opacidad, no se
 *   ve. Dejando que engorde, se lee como fondo, que es su trabajo.
 */

function base(props: SVGProps<SVGSVGElement>): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 64 64",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/**
 * Vaso Tumbler con tapa y popote. Es LA pieza del taller: la que cada persona
 * se lleva terminada, así que encabeza la composición.
 */
export function TumblerArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* popote doblado */}
      <path strokeWidth={1.8} d="M37 11 V5.5 H43" />
      {/* tapa */}
      <path d="M17.5 11 H46.5 A1.5 1.5 0 0 1 48 12.5 V15.5 A1.5 1.5 0 0 1 46.5 17 H17.5 A1.5 1.5 0 0 1 16 15.5 V12.5 A1.5 1.5 0 0 1 17.5 11 Z" />
      {/* cuerpo cónico: más ancho arriba, como un tumbler real */}
      <path d="M19.5 17 L24 51.5 A3.5 3.5 0 0 0 27.5 55 H36.5 A3.5 3.5 0 0 0 40 51.5 L44.5 17" />
      {/* banda decorativa: es donde va el diseño personalizado */}
      <path strokeWidth={1.4} d="M21.6 32 H42.4" />
      <path strokeWidth={1.4} d="M22.4 38 H41.6" />
    </svg>
  );
}

/**
 * SnowGlobe: cúpula sobre base con partículas suspendidas. La técnica que
 * da nombre a media línea de MatrixLab Tumbler.
 */
export function SnowGlobeArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* cúpula */}
      <circle cx="32" cy="27" r="15" />
      {/* base */}
      <path d="M21 42 H43 L45.5 52.5 A2 2 0 0 1 43.5 55 H20.5 A2 2 0 0 1 18.5 52.5 Z" />
      {/* partículas suspendidas: lo que hace que un SnowGlobe se vea vivo */}
      <circle cx="26" cy="21" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="37" cy="19" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="30" cy="32" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="38.5" cy="30" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="24" cy="34" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Frasco de Sparkles con glitter saliendo. Los materiales del taller: qué se
 * usa y para qué sirve cada cosa.
 */
export function GlitterJarArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* tapa */}
      <path d="M22 20 H38 A2 2 0 0 1 40 22 V26 H20 V22 A2 2 0 0 1 22 20 Z" />
      {/* frasco */}
      <path d="M21 26 H39 A2 2 0 0 1 41 28 V50 A4 4 0 0 1 37 54 H23 A4 4 0 0 1 19 50 V28 A2 2 0 0 1 21 26 Z" />
      {/* nivel del glitter dentro */}
      <path strokeWidth={1.4} d="M19.6 38 H40.4" />
      <circle cx="26" cy="44" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="33" cy="47" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="30" cy="42" r="1" fill="currentColor" stroke="none" />
      {/* destellos escapando por la esquina */}
      <path
        strokeWidth={1.5}
        d="M48 10 C48.7 14 50 15.3 54 16 C50 16.7 48.7 18 48 22 C47.3 18 46 16.7 42 16 C46 15.3 47.3 14 48 10 Z"
      />
      <path
        strokeWidth={1.3}
        d="M54.5 26 C54.9 28 55.5 28.6 57.5 29 C55.5 29.4 54.9 30 54.5 32 C54.1 30 53.5 29.4 51.5 29 C53.5 28.6 54.1 28 54.5 26 Z"
      />
    </svg>
  );
}

/**
 * Gota de Magic Flow con salpicaduras. Los líquidos y bases del taller: donde
 * están casi todos los errores de principiante (y sus trucos).
 */
export function PourDropArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* gota principal */}
      <path d="M32 9 C40 22 47 29 47 37 A15 15 0 0 1 17 37 C17 29 24 22 32 9 Z" />
      {/* brillo interior: la curva que hace que se lea como líquido */}
      <path strokeWidth={1.4} d="M25 39 A7 7 0 0 0 30 46.5" />
      {/* gotas satélite */}
      <path strokeWidth={1.5} d="M11 22 C13.5 26 15.5 28 15.5 30 A4.5 4.5 0 0 1 6.5 30 C6.5 28 8.5 26 11 22 Z" />
      <path strokeWidth={1.3} d="M53.5 17 C55.5 20.2 57 21.8 57 23.4 A3.6 3.6 0 0 1 50 23.4 C50 21.8 51.5 20.2 53.5 17 Z" />
    </svg>
  );
}

/**
 * Pincel con su trazo. La práctica guiada: se trabaja con las manos desde el
 * primer minuto, no se mira una demostración.
 */
export function BrushArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* mango */}
      <path strokeWidth={2.6} d="M13 47 L30 30" />
      {/* virola */}
      <path d="M28.5 28 L33 23.5 L40 30.5 L35.5 35 Z" />
      {/* pelo del pincel, en punta */}
      <path d="M35 24.5 L46 13.5 A4 4 0 0 1 50.5 18 L39.5 29 Z" />
      {/* el trazo que se está pintando */}
      <path strokeWidth={1.5} d="M10 53.5 C18 57 29 55.5 36 50.5" />
    </svg>
  );
}

/**
 * Destello de cuatro puntas: los acabados. Brillo, textura y detalle final —
 * lo que separa una pieza casera de una que se ve profesional.
 */
export function ShineArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M34 5 C36 20 45 29 60 31 C45 33 36 42 34 57 C32 42 23 33 8 31 C23 29 32 20 34 5 Z" />
      <path
        strokeWidth={1.4}
        d="M13 41 C13.8 46 15 47.2 20 48 C15 48.8 13.8 50 13 55 C12.2 50 11 48.8 6 48 C11 47.2 12.2 46 13 41 Z"
      />
    </svg>
  );
}

/**
 * Tres personas juntas: la comunidad del taller. Se crea al lado de alguien
 * que también está empezando, y eso es la mitad de la experiencia.
 */
export function CommunityArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* persona del centro */}
      <circle cx="32" cy="20" r="7.5" />
      <path d="M19 48 A13 13 0 0 1 45 48" />
      {/* persona de la izquierda */}
      <circle cx="14" cy="27" r="5.5" strokeWidth={1.7} />
      <path strokeWidth={1.7} d="M4.5 47 A9.5 9.5 0 0 1 15 37.8" />
      {/* persona de la derecha */}
      <circle cx="50" cy="27" r="5.5" strokeWidth={1.7} />
      <path strokeWidth={1.7} d="M59.5 47 A9.5 9.5 0 0 0 49 37.8" />
    </svg>
  );
}

/**
 * Marca de destello suelta, para sembrar el fondo de una composición. Es la
 * misma forma que `ShineArt` sin la segunda punta: a tamaño pequeño la
 * segunda estrella se convierte en una mancha.
 */
export function SparkleMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M32 6 C34 21 43 30 58 32 C43 34 34 43 32 58 C30 43 21 34 6 32 C21 30 30 21 32 6 Z" />
    </svg>
  );
}

/**
 * Marco de foto con montañas: marcador de posición de la galería mientras no
 * hay fotos subidas. Dice "aquí van fotos" sin fingir que ya las hay.
 */
export function PhotoFrameArt(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M11 14 H53 A3 3 0 0 1 56 17 V47 A3 3 0 0 1 53 50 H11 A3 3 0 0 1 8 47 V17 A3 3 0 0 1 11 14 Z" />
      <circle cx="21.5" cy="25" r="3.5" strokeWidth={1.6} />
      <path strokeWidth={1.6} d="M8.6 43 L23 30.5 L33 39 L42.5 31 L55.4 42" />
    </svg>
  );
}

/**
 * Triángulo de reproducción dentro de una tarjeta. Encabeza las vistas previas
 * de video, que NO son un reproductor incrustado (ver videos.ts).
 */
export function PlayMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M14 10 H50 A4 4 0 0 1 54 14 V50 A4 4 0 0 1 50 54 H14 A4 4 0 0 1 10 50 V14 A4 4 0 0 1 14 10 Z" />
      <path d="M27.5 22.5 L43 32 L27.5 41.5 Z" />
    </svg>
  );
}

/**
 * Mapa de `CourseArtKey` a su dibujo. Vive aquí y no en los datos para que el
 * módulo de contenido siga siendo texto puro, sin importar componentes.
 */
export const COURSE_ART: Record<
  CourseArtKey,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  tumbler: TumblerArt,
  snowglobe: SnowGlobeArt,
  glitter: GlitterJarArt,
  pour: PourDropArt,
  hand: BrushArt,
  shine: ShineArt,
  community: CommunityArt,
};

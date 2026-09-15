import type { ComponentType, ReactNode, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { categoryLogoScale } from "@/lib/store/category-logos";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type FamilyAccent = "coral" | "violet" | "cyan" | "green";

/**
 * Clases completas por acento (Tailwind necesita los nombres estáticos, no
 * se pueden componer con template strings). Mismo criterio que el resto de
 * la landing.
 */
const ACCENT_STYLES: Record<
  FamilyAccent,
  { text: string; hover: string }
> = {
  coral: {
    text: "text-ml-coral",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  violet: {
    text: "text-ml-violet",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  cyan: {
    text: "text-ml-cyan",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  green: {
    text: "text-ml-green",
    hover: "hover:border-ml-green/50 hover:shadow-glow-green",
  },
};

type FamilyVisual =
  | { kind: "image"; src: string; alt?: string }
  | { kind: "icon"; Icon: IconComponent };

interface FamilyCardBase {
  badgeIcon: IconComponent;
  badgeLabel: string;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  accent: FamilyAccent;
  /** Degradado de fondo completo (dos tonos), igual que las cards de referencia. */
  gradient: string;
  visual: FamilyVisual;
}

export interface FamilyCardProps extends FamilyCardBase {
  href: string;
  cta: string;
}

/** Contenido común a las dos variantes: fondo, visual, badge, título y copy. */
function FamilyCardBody({
  badgeIcon: BadgeIcon,
  badgeLabel,
  titlePrefix,
  titleHighlight,
  description,
  accent,
  gradient,
  visual,
  children,
}: FamilyCardBase & { children: ReactNode }) {
  const { text } = ACCENT_STYLES[accent];

  return (
    <>
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`}
        aria-hidden
      />

      {visual.kind === "image" ? (
        /* Caja IDÉNTICA en las seis tarjetas (mismo tamaño y mismo encuadre).
           Lo que cambia por logo es la escala de la imagen dentro de ella:
           cada PNG trae distinto margen transparente, así que sin corregirlo
           el de 3D se vería un 15% más pequeño que el escolar con la misma
           caja. Ver `categoryLogoScale`. El escalado es uniforme y sale del
           centro, así que ni deforma ni descoloca el logo. */
        <div
          className={`${LOGO_BOX} opacity-20 transition duration-300 group-hover:scale-105 group-hover:opacity-40 sm:opacity-25`}
          aria-hidden
        >
          <Image
            src={visual.src}
            alt={visual.alt ?? ""}
            fill
            sizes="272px"
            className="object-contain"
            style={{ transform: `scale(${categoryLogoScale(visual.src)})` }}
          />
        </div>
      ) : (
        <visual.Icon
          className={`pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 ${text} opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.16]`}
          aria-hidden
        />
      )}

      <span
        className={`glass relative inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm ${text}`}
      >
        <BadgeIcon className="h-4 w-4" aria-hidden />
        {badgeLabel}
      </span>

      <div className="relative mt-8">
        {/* El texto se mantiene en una medida cómoda de lectura (max-w-sm),
            pero la acción NO: los dos accesos de Regreso a Clases suman más
            que esa medida y quedarían partidos en dos filas, alargando la
            tarjeta. Van fuera del límite, alineados al mismo borde izquierdo
            que el título, así que las seis tarjetas siguen alineadas igual. */}
        <div className="max-w-sm">
          <h3 className="text-3xl font-bold">
            {titlePrefix} <span className="text-gradient">{titleHighlight}</span>
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-ml-white/70 sm:text-base">
            {description}
          </p>
        </div>
        {children}
      </div>
    </>
  );
}

/**
 * Caja del logo: misma para todas las tarjetas. Un poco mayor que la anterior
 * (17rem frente a 16) y anclada siempre en la misma esquina, para que las seis
 * familias se lean como una serie.
 */
const LOGO_BOX =
  "pointer-events-none absolute -bottom-10 -right-7 h-[17rem] w-[17rem]";

/* Nota sobre la opacidad (va en la clase, no aquí): 25% en general y 20% por
   debajo de `sm`. En móvil la tarjeta mide ~348 px y el logo ocupa casi todo
   su ancho, así que a la misma intensidad competía con el título y el copy.
   Bajarlo cinco puntos deja el mismo tamaño y devuelve la lectura. */

/**
 * Casco de la tarjeta, idéntico en las seis: mismo radio, mismo relleno y el
 * mismo alto mínimo. El suelo común no es decorativo: la rejilla estira toda
 * la fila hasta la tarjeta más alta, así que fijarlo deja las seis exactamente
 * iguales en vez de depender de cuánto ocupe el copy de cada una.
 * `justify-between` mantiene el badge arriba y el bloque de título + CTA
 * abajo, alineados entre tarjetas.
 *
 * Son tres tramos porque el ancho de tarjeta cambia mucho: una columna en
 * móvil (22rem), dos columnas estrechas entre `md` y `lg` (25rem) y dos
 * columnas anchas desde `lg` (20rem, el tamaño compacto de referencia).
 *
 * El escalón de `md` a `lg` existe por un solo motivo: en ese tramo la rejilla
 * ya es de dos columnas pero cada tarjeta mide ~350 px. A ese ancho el copy
 * ocupa una línea más y los dos accesos de Regreso a Clases no caben en una
 * sola fila, así que el suelo sube a 25rem para que las seis sigan parejas;
 * desde `lg` todo vuelve a caber y baja a 20rem.
 */
const SHELL =
  "glass group relative flex h-full min-h-[22rem] flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition sm:p-10 md:min-h-[25rem] lg:min-h-80";

/**
 * Tarjeta grande de familia MatrixLab para la sección "El laboratorio" de la
 * home. Estructura y proporciones tomadas 1:1 de las cards de referencia
 * (MatrixLab Tumbler / Etiquetas escolares): badge -> título -> copy -> CTA,
 * con el visual/logo integrado a la derecha.
 */
export default function FamilyCard({
  href,
  cta,
  accent,
  ...base
}: FamilyCardProps) {
  const { text, hover } = ACCENT_STYLES[accent];

  return (
    <Link href={href} className={`${SHELL} hover:-translate-y-1 ${hover}`}>
      <FamilyCardBody {...base} accent={accent}>
        <span className={`mt-6 inline-flex items-center gap-2 font-semibold ${text}`}>
          {cta}
          <ArrowRight
            className="h-5 w-5 transition group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </FamilyCardBody>
    </Link>
  );
}

/**
 * Variante para una familia con DOS caminos reales (hoy, Regreso a Clases:
 * editor de etiquetas y catálogo escolar).
 *
 * La tarjeta NO es un enlace: cada acceso trae el suyo, porque un `<a>` no
 * puede contener otro `<a>` y porque un destino único volvería a esconder uno
 * de los dos caminos. El resto —casco, relleno, logo, badge, título y copy— es
 * exactamente el mismo componente que las otras cinco tarjetas, así que mide
 * lo mismo: los accesos ocupan el sitio del CTA, ni una línea más.
 */
export function FamilyDualCard({
  actions,
  ...base
}: FamilyCardBase & { actions: ReactNode }) {
  return (
    <div className={SHELL}>
      <FamilyCardBody {...base}>{actions}</FamilyCardBody>
    </div>
  );
}

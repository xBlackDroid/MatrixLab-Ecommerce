import type { CourseAccent } from "@/lib/store/courses/types";

/**
 * Clases de marca por acento.
 *
 * Están ESCRITAS COMPLETAS a propósito. Tailwind descubre las clases leyendo
 * el código fuente como texto: una construida al vuelo —`text-ml-${accent}`—
 * no aparece en ningún archivo, así que no se genera y el color simplemente
 * no existe en producción. Es un fallo que no se ve en desarrollo si esa clase
 * ya la usó otro componente.
 */
export interface CourseAccentClasses {
  /** Color del texto de acento. */
  text: string;
  /** Fondo tenue para insignias y medallones. */
  badge: string;
  /** Borde tenue (chips, tarjetas). */
  border: string;
  /** Borde al pasar el cursor. */
  hoverBorder: string;
  /** Degradado de fondo del panel. */
  gradient: string;
  /** Mancha de color difuminada. */
  orb: string;
  /** Resplandor del CTA sólido. */
  glow: string;
  /** Fondo sólido del CTA (texto oscuro encima). */
  solid: string;
  /** Fondo sólido en hover. */
  solidHover: string;
}

export const COURSE_ACCENTS: Record<CourseAccent, CourseAccentClasses> = {
  violet: {
    text: "text-ml-violet",
    badge: "bg-ml-violet/15",
    border: "border-ml-violet/30",
    hoverBorder: "hover:border-ml-violet/50",
    gradient: "from-ml-violet/20 via-ml-cyan/[0.06] to-transparent",
    orb: "bg-ml-violet/20",
    glow: "shadow-glow-violet",
    solid: "bg-ml-violet",
    solidHover: "hover:bg-ml-violet/90",
  },
  cyan: {
    text: "text-ml-cyan",
    badge: "bg-ml-cyan/15",
    border: "border-ml-cyan/30",
    hoverBorder: "hover:border-ml-cyan/50",
    gradient: "from-ml-cyan/20 via-ml-violet/[0.06] to-transparent",
    orb: "bg-ml-cyan/20",
    glow: "shadow-glow-cyan",
    solid: "bg-ml-cyan",
    solidHover: "hover:bg-ml-cyan/90",
  },
  coral: {
    text: "text-ml-coral",
    badge: "bg-ml-coral/15",
    border: "border-ml-coral/30",
    hoverBorder: "hover:border-ml-coral/50",
    gradient: "from-ml-coral/20 via-ml-violet/[0.06] to-transparent",
    orb: "bg-ml-coral/20",
    glow: "shadow-glow-coral",
    solid: "bg-ml-coral",
    solidHover: "hover:bg-ml-coral/90",
  },
  green: {
    text: "text-ml-green",
    badge: "bg-ml-green/15",
    border: "border-ml-green/30",
    hoverBorder: "hover:border-ml-green/50",
    gradient: "from-ml-green/20 via-ml-cyan/[0.06] to-transparent",
    orb: "bg-ml-green/20",
    glow: "shadow-glow-green",
    solid: "bg-ml-green",
    solidHover: "hover:bg-ml-green/90",
  },
};

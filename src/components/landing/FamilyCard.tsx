import type { ComponentType, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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

export interface FamilyCardProps {
  href: string;
  badgeIcon: IconComponent;
  badgeLabel: string;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  cta: string;
  accent: FamilyAccent;
  /** Degradado de fondo completo (dos tonos), igual que las cards de referencia. */
  gradient: string;
  visual: FamilyVisual;
}

/**
 * Tarjeta grande de familia MatrixLab para la sección "El laboratorio" de la
 * home. Estructura y proporciones tomadas 1:1 de las cards de referencia
 * (MatrixLab Tumbler / Etiquetas escolares): badge -> título -> copy -> CTA,
 * con el visual/logo integrado a la derecha.
 */
export default function FamilyCard({
  href,
  badgeIcon: BadgeIcon,
  badgeLabel,
  titlePrefix,
  titleHighlight,
  description,
  cta,
  accent,
  gradient,
  visual,
}: FamilyCardProps) {
  const { text, hover } = ACCENT_STYLES[accent];

  return (
    <Link
      href={href}
      className={`glass group relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition hover:-translate-y-1 sm:p-10 ${hover}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient}`}
        aria-hidden
      />

      {visual.kind === "image" ? (
        <div
          className="pointer-events-none absolute -bottom-12 -right-8 h-64 w-64 opacity-25 transition duration-300 group-hover:scale-105 group-hover:opacity-40"
          aria-hidden
        >
          <Image
            src={visual.src}
            alt={visual.alt ?? ""}
            fill
            sizes="256px"
            className="object-contain"
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

      <div className="relative mt-8 max-w-sm">
        <h3 className="text-3xl font-bold">
          {titlePrefix} <span className="text-gradient">{titleHighlight}</span>
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ml-white/70 sm:text-base">
          {description}
        </p>
        <span className={`mt-6 inline-flex items-center gap-2 font-semibold ${text}`}>
          {cta}
          <ArrowRight
            className="h-5 w-5 transition group-hover:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

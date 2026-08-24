import type { ComponentType, ReactNode, SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type StoreFamilyAccent = "coral" | "violet" | "cyan" | "green";

/**
 * Clases completas por acento (Tailwind necesita los nombres estáticos, no
 * se pueden componer con template strings). Mismo criterio que FamilyCard
 * de la home.
 */
const ACCENT_STYLES: Record<
  StoreFamilyAccent,
  {
    badgeText: string;
    ctaSolid: string;
    blur: string;
    itemBorder: string;
    itemIcon: string;
  }
> = {
  coral: {
    badgeText: "text-ml-coral",
    ctaSolid: "bg-ml-coral text-ml-bg shadow-glow-coral hover:bg-ml-coral/90",
    blur: "bg-ml-coral/10",
    itemBorder: "hover:border-ml-coral/50",
    itemIcon: "text-ml-coral",
  },
  violet: {
    badgeText: "text-ml-violet",
    ctaSolid: "bg-ml-violet text-ml-bg shadow-glow-violet hover:bg-ml-violet/90",
    blur: "bg-ml-violet/10",
    itemBorder: "hover:border-ml-violet/50",
    itemIcon: "text-ml-violet",
  },
  cyan: {
    badgeText: "text-ml-cyan",
    ctaSolid: "bg-ml-cyan text-ml-bg shadow-glow-cyan hover:bg-ml-cyan/90",
    blur: "bg-ml-cyan/10",
    itemBorder: "hover:border-ml-cyan/50",
    itemIcon: "text-ml-cyan",
  },
  green: {
    badgeText: "text-ml-green",
    ctaSolid: "bg-ml-green text-ml-bg shadow-glow-green hover:bg-ml-green/90",
    blur: "bg-ml-green/10",
    itemBorder: "hover:border-ml-green/50",
    itemIcon: "text-ml-green",
  },
};

interface FamilyItem {
  label: string;
  href: string;
  icon: IconComponent;
}

interface FamilyChip {
  label: string;
  icon?: IconComponent;
}

type FamilyRight =
  /** Grid de accesos internos reales (clickeables). */
  | { kind: "items"; items: FamilyItem[] }
  /** Opciones reales pero sin ruta propia (p. ej. plantillas dentro de un
   * diseñador de un solo lienzo): se muestran, no se inventan links falsos. */
  | { kind: "chips"; heading: string; items: FamilyChip[] }
  /** Sin columna derecha: el bloque se apoya en el watermark de fondo. */
  | { kind: "none" };

export type FamilyBackgroundLogo =
  /** Logo real de la línea (asset existente en public/images/categories). */
  | { kind: "image"; src: string; alt?: string }
  /** Sin logo oficial: recurso vectorial ya usado como icono de la familia. */
  | { kind: "icon"; icon: IconComponent };

/**
 * Marca de agua decorativa de familia: logo o icono grande y muy tenue,
 * detrás del contenido. Reusada por StoreFamilySection y por el bloque
 * "Etiquetas Escolares Lab" (que no usa StoreFamilySection porque conserva
 * su estructura propia), para no duplicar las mismas clases dos veces.
 */
export function FamilyWatermark({ logo }: { logo?: FamilyBackgroundLogo }) {
  if (!logo) return null;
  const positionClasses =
    "pointer-events-none absolute right-0 top-1/2 h-56 w-56 -translate-y-[40%] select-none sm:h-72 sm:w-72 lg:h-80 lg:w-80";
  if (logo.kind === "image") {
    return (
      <div className={`${positionClasses} opacity-10`} aria-hidden="true">
        <Image
          src={logo.src}
          alt={logo.alt ?? ""}
          fill
          sizes="320px"
          className="object-contain"
        />
      </div>
    );
  }
  return (
    <logo.icon
      className={`${positionClasses} opacity-[0.08]`}
      aria-hidden="true"
    />
  );
}

export interface StoreFamilySectionProps {
  id?: string;
  accent: StoreFamilyAccent;
  badgeIcon: IconComponent;
  badgeLabel: string;
  title: ReactNode;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  right: FamilyRight;
  /** Lado del blur decorativo, para alternar el ritmo visual entre bloques. */
  blurSide?: "left" | "right";
  /** Marca de agua decorativa detrás del contenido (logo o icono grande, muy tenue). */
  backgroundLogo?: FamilyBackgroundLogo;
}

/**
 * Bloque grande de familia MatrixLab para /tienda. Mismo lenguaje visual que
 * el bloque de referencia "T-Shirt Lab" que ya vivía en esta página: badge +
 * título + copy + CTA a la izquierda, accesos internos a la derecha.
 */
export default function StoreFamilySection({
  id,
  accent,
  badgeIcon: BadgeIcon,
  badgeLabel,
  title,
  description,
  ctaLabel,
  ctaHref,
  right,
  blurSide = "left",
  backgroundLogo,
}: StoreFamilySectionProps) {
  const s = ACCENT_STYLES[accent];
  const hasRight = right.kind !== "none";

  return (
    <section id={id} className="scroll-mt-24 px-4 pb-6 sm:px-6">
      <div className="glass relative mx-auto max-w-7xl overflow-hidden rounded-3xl p-8 sm:p-14">
        <div
          className={`pointer-events-none absolute -top-24 h-72 w-72 rounded-full ${blurSide === "left" ? "-left-24" : "-right-24"} ${s.blur} blur-3xl`}
          aria-hidden
        />

        {/* Watermark de marca: detrás del contenido (menor en el DOM = pinta
            primero = queda debajo), muy tenue, no interactivo. */}
        <FamilyWatermark logo={backgroundLogo} />

        <div
          className={`relative grid items-center gap-10 ${hasRight ? "lg:grid-cols-2" : ""}`}
        >
          <div>
            <span
              className={`glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm ${s.badgeText}`}
            >
              <BadgeIcon className="h-4 w-4" aria-hidden />
              {badgeLabel}
            </span>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">{title}</h2>
            <p className="mt-4 max-w-lg text-ml-white/65">{description}</p>
            <Link
              href={ctaHref}
              className={`mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold transition hover:scale-[1.02] ${s.ctaSolid}`}
            >
              {ctaLabel}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>

          {right.kind === "items" && (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {right.items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`glass group flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-5 text-center transition hover:-translate-y-0.5 ${s.itemBorder}`}
                >
                  <item.icon
                    className={`h-6 w-6 ${s.itemIcon} transition group-hover:scale-110`}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold sm:text-sm">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {right.kind === "chips" && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ml-white/45">
                {right.heading}
              </p>
              <div className="flex flex-wrap gap-2">
                {right.items.map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-ml-white/70 sm:text-sm"
                  >
                    {chip.icon && (
                      <chip.icon className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

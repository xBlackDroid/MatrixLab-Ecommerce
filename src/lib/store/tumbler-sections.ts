import type { ComponentType, SVGProps } from "react";
import { CupSoda, Droplets, Gem, Gift, Layers, Sparkles, Sticker } from "lucide-react";
import { CUPS_CATEGORY_HANDLE } from "./tumbler-cups";
import { STICKERS_CATEGORY_HANDLE } from "./tumbler-stickers";
import { SPARKLES_CATEGORY_HANDLE } from "./tumbler-sparkles";
import { READY_TUMBLER_HANDLE, READY_TUMBLER_TITLE } from "./tumbler-ready";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface TumblerBlockDisplay {
  /** Ruta comercial: categoría existente o catálogo local de vasos listos. */
  handle: string;
  title: string;
  description: string;
  icon: IconComponent;
  accentText: string;
  iconClasses: string;
  gradient: string;
  hover: string;
}

/**
 * Presentación curada de las subcategorías de MatrixLab Tumbler: nombre
 * visible, copy y acento propios por línea, en el orden comercial deseado.
 * Compartida por /tienda y la categoría madre; no modifica títulos en base.
 * Los ocho handles de los insumos son los reales de
 * `TUMBLER_SUBCATEGORY_HANDLES`; el catálogo local de vasos listos se suma
 * como una nueva tarjeta comercial.
 */
export const TUMBLER_BLOCKS_DISPLAY: TumblerBlockDisplay[] = [
  {
    handle: READY_TUMBLER_HANDLE,
    title: READY_TUMBLER_TITLE,
    description: "Elige tu favorito. Ya le pusimos la magia. Vasos decorados para ti o para un regalo que se sienta especial.",
    icon: Gift,
    accentText: "text-ml-coral",
    iconClasses: "bg-ml-coral/15 text-ml-coral",
    gradient: "from-ml-coral/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  {
    handle: SPARKLES_CATEGORY_HANDLE, // "repuestos-consumibles"
    title: "Sparkle Mix",
    description:
      "Sparkles, glitter y mezclas decorativas para crear efectos únicos en vasos y proyectos personalizados.",
    icon: Sparkles,
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-coral/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    handle: CUPS_CATEGORY_HANDLE, // "snowglobe"
    title: "SnowGlobe Cups",
    description:
      "Vasos y bases para crear proyectos SnowGlobe, tumblers personalizados y diseños creativos.",
    icon: CupSoda,
    accentText: "text-ml-cyan",
    iconClasses: "bg-ml-cyan/15 text-ml-cyan",
    gradient: "from-ml-cyan/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  {
    handle: "llaveros",
    title: "Llaveros creativos",
    description:
      "Llaveros y pequeños detalles para llevar tu estilo MatrixLab contigo todos los días.",
    icon: Gift,
    accentText: "text-ml-coral",
    iconClasses: "bg-ml-coral/15 text-ml-coral",
    gradient: "from-ml-coral/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  {
    handle: "tags-acrilico",
    title: "Tags de acrílico",
    description:
      "Tags ligeros y personalizables para nombres, regalos, empaques y proyectos creativos.",
    icon: Gem,
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-cyan/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    handle: STICKERS_CATEGORY_HANDLE, // "wraps-glow-finish"
    title: "Wraps & Glow Studio",
    description:
      "Stickers UV y wraps premium para transformar vasos y superficies con diseños de alta definición y acabados especiales.",
    icon: Sticker,
    accentText: "text-ml-coral",
    iconClasses: "bg-ml-coral/15 text-ml-coral",
    gradient: "from-ml-coral/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  {
    handle: "magic-flow",
    title: "Magic Flow",
    description:
      "Líquidos, bases y mezclas especiales para efectos, movimiento y acabados en proyectos SnowGlobe y Tumbler.",
    icon: Droplets,
    accentText: "text-ml-cyan",
    iconClasses: "bg-ml-cyan/15 text-ml-cyan",
    gradient: "from-ml-cyan/25 via-ml-green/10 to-transparent",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  {
    handle: "acrilicos",
    title: "Acrylab",
    description:
      "Piezas de acrílico precortadas para llaveros, tags, figuras y proyectos creativos listos para personalizar.",
    icon: Gem,
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-cyan/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    handle: "accesorios-personalizacion",
    title: "Creator Tools",
    description:
      "Herramientas, repuestos y consumibles para tu estación creativa MatrixLab Tumbler.",
    icon: Layers,
    accentText: "text-ml-green",
    iconClasses: "bg-ml-green/15 text-ml-green",
    gradient: "from-ml-green/25 via-ml-violet/10 to-transparent",
    hover: "hover:border-ml-green/50 hover:shadow-glow-green",
  },
];

/** La tienda principal y la familia usan exactamente los mismos apartados. */
export function tumblerSections(handles: readonly string[]) {
  const available = new Set(handles);
  return TUMBLER_BLOCKS_DISPLAY.filter((item) => item.handle === READY_TUMBLER_HANDLE || available.has(item.handle));
}

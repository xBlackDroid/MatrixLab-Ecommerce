import type { SVGProps } from "react";

/**
 * Iconos de prendas para el laboratorio. `lucide-react` no trae gorra (cap) ni
 * sudadera (hoodie) ni tote, así que aquí van como SVG propios con el MISMO
 * estilo de trazo que lucide (24×24, stroke currentColor, ancho 2, juntas/puntas
 * redondeadas). Cada prenda usa un icono específico — nada de varitas genéricas
 * repetidas.
 *
 * Aceptan las mismas props que un icono lucide (`className`, etc.), así que se
 * usan igual: `<CapIcon className="h-8 w-8" />`.
 */

type GarmentIconProps = SVGProps<SVGSVGElement>;

function baseProps(props: GarmentIconProps): GarmentIconProps {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/** Gorra / cap (cúpula + visera). */
export function CapIcon(props: GarmentIconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* cúpula */}
      <path d="M5 15a7 7 0 0 1 14 0" />
      {/* base de la cúpula */}
      <path d="M5 15h14" />
      {/* visera */}
      <path d="M19 15h2.2a1.3 1.3 0 0 1 .3 2.5L19 18.5" />
      {/* costura central */}
      <path d="M12 8.2V15" />
    </svg>
  );
}

/** Sudadera / hoodie (cuerpo + capucha + cordones). */
export function HoodieIcon(props: GarmentIconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* manga + costado izquierdo */}
      <path d="M7 21V11l-2 1.2-2.8-2.6L7 4.5" />
      {/* manga + costado derecho */}
      <path d="M17 21V11l2 1.2 2.8-2.6L17 4.5" />
      {/* bajo */}
      <path d="M7 21h10" />
      {/* abertura de la capucha */}
      <path d="M7 4.5C7 9 17 9 17 4.5" />
      {/* cordones */}
      <path d="M10.5 7v2.6" />
      <path d="M13.5 7v2.6" />
    </svg>
  );
}

/** Tote bag (cuerpo + asa). */
export function ToteIcon(props: GarmentIconProps) {
  return (
    <svg {...baseProps(props)}>
      {/* cuerpo de la bolsa */}
      <path d="M5 8h14l-1 12H6z" />
      {/* asa */}
      <path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" />
    </svg>
  );
}

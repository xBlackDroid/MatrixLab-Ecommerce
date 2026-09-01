import type { SVGProps } from "react";

/**
 * Decorativos de la sección de empresas.
 *
 * Sustituyen a `Sparkles` y `Building2`. El problema de aquellos no era el
 * dibujo sino el significado: unas estrellas dicen "magia genérica" y un
 * edificio dice "oficina", y ninguna de las dos cosas es lo que se vende aquí.
 * Lo que se vende es una caja de regalo de marca y un lote listo para entregar,
 * así que eso es lo que se dibuja.
 *
 * Mismo criterio técnico que las siluetas de prenda: lienzo 64×64, todo en
 * `currentColor` sin degradados internos (evita colisiones de ID cuando la
 * misma figura se pinta como watermark y como insignia), y
 * `vectorEffect="non-scaling-stroke"` para que el trazo no engorde al
 * escalarlas a 12rem.
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
 * Caja de regalo con moño: regalos de marca, kits de bienvenida, ediciones
 * limitadas. Lo que se entrega a UNA persona y se recuerda.
 */
export function GiftBoxSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* tapa */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M11 20.5 H53 A2 2 0 0 1 55 22.5 V28 A2 2 0 0 1 53 30 H11 A2 2 0 0 1 9 28 V22.5 A2 2 0 0 1 11 20.5 Z"
      />
      {/* cuerpo */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M13 30 V51.5 A3 3 0 0 0 16 54.5 H48 A3 3 0 0 0 51 51.5 V30"
      />
      {/* cinta */}
      <path vectorEffect="non-scaling-stroke" d="M32 30 V54.5" />
      {/* moño */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.8}
        d="M32 20.4 C27.4 13.4 20.6 11.2 19 14.6 C17.6 17.6 23.4 19.8 32 20.4 Z"
      />
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.8}
        d="M32 20.4 C36.6 13.4 43.4 11.2 45 14.6 C46.4 17.6 40.6 19.8 32 20.4 Z"
      />
    </svg>
  );
}

/**
 * Lote apilado con etiqueta de marca: uniformes, kits, campañas y producción
 * por volumen. Lo que se entrega a UN EQUIPO entero, rotulado y contado.
 */
export function BoxStackSilhouette(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      {/* caja de atrás */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M32 13.5 H50.5 A2 2 0 0 1 52.5 15.5 V29.5 A2 2 0 0 1 50.5 31.5 H32"
      />
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M42.5 13.5 V31.5"
      />
      {/* caja de delante */}
      <path
        vectorEffect="non-scaling-stroke"
        d="M13.5 31.5 H39.5 A2 2 0 0 1 41.5 33.5 V51.5 A2 2 0 0 1 39.5 53.5 H13.5 A2 2 0 0 1 11.5 51.5 V33.5 A2 2 0 0 1 13.5 31.5 Z"
      />
      {/* cinta de embalaje */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M26.5 31.5 V53.5"
      />
      {/* etiqueta de marca */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M15.5 37 H23 V43 H15.5 Z"
      />
      {/* pila: la tercera insinuada */}
      <path
        vectorEffect="non-scaling-stroke"
        strokeWidth={1.5}
        d="M45 34.5 H52.5 A2 2 0 0 1 54.5 36.5 V51.5 A2 2 0 0 1 52.5 53.5 H45"
      />
    </svg>
  );
}

/**
 * Mancha orgánica suave para el fondo de la sección. Es sólo una forma; el
 * color y el difuminado los pone quien la usa.
 */
export function SoftBlob(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 200 200" fill="currentColor" aria-hidden {...props}>
      <path d="M48.8 -64.5C61.9 -55.6 69.4 -38.6 73.2 -21.1C77 -3.6 77.1 14.4 70.2 29.3C63.3 44.2 49.4 56 33.9 63.4C18.4 70.8 1.3 73.8 -16.6 71.4C-34.5 69 -53.2 61.2 -64.4 47.4C-75.6 33.6 -79.3 13.8 -76.4 -4.6C-73.5 -23 -64 -40 -50.4 -49.6C-36.8 -59.2 -19.1 -61.4 -0.3 -61C18.5 -60.6 35.7 -73.4 48.8 -64.5Z" transform="translate(100 100)" />
    </svg>
  );
}

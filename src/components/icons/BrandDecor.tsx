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
        d="M11 20.5 H53 A2 2 0 0 1 55 22.5 V28 A2 2 0 0 1 53 30 H11 A2 2 0 0 1 9 28 V22.5 A2 2 0 0 1 11 20.5 Z"
      />
      {/* cuerpo */}
      <path
        d="M13 30 V51.5 A3 3 0 0 0 16 54.5 H48 A3 3 0 0 0 51 51.5 V30"
      />
      {/* cinta */}
      <path d="M32 30 V54.5" />
      {/* moño */}
      <path
        strokeWidth={1.8}
        d="M32 20.4 C27.4 13.4 20.6 11.2 19 14.6 C17.6 17.6 23.4 19.8 32 20.4 Z"
      />
      <path
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
      {/* DOS cajas cerradas, apiladas y sin solaparse.
          La versión anterior tenía tres cajas a las que les faltaba la pared
          izquierda, contando con que la de delante las taparía. No las tapaba:
          con `fill: none` no hay nada que oculte, y además ni siquiera se
          solapaban, así que se veían tres letras C sueltas. Dos rectángulos
          completos, uno encima del otro, se leen como pila a la primera. */}
      {/* caja de arriba */}
      <path d="M20 13 H38 A2 2 0 0 1 40 15 V28 A2 2 0 0 1 38 30 H20 A2 2 0 0 1 18 28 V15 A2 2 0 0 1 20 13 Z" />
      <path strokeWidth={1.5} d="M29 13 V30" />
      {/* caja de abajo, más ancha */}
      <path d="M14 32 H42 A2 2 0 0 1 44 34 V51 A2 2 0 0 1 42 53 H14 A2 2 0 0 1 12 51 V34 A2 2 0 0 1 14 32 Z" />
      {/* cinta de embalaje */}
      <path strokeWidth={1.5} d="M28 32 V53" />
      {/* etiqueta de marca: lo que convierte una caja en un lote rotulado */}
      <path strokeWidth={1.5} d="M16.5 37.5 H24.5 V44 H16.5 Z" />
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

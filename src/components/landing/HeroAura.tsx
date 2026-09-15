import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface HeroAuraItem {
  Icon: IconComponent;
  /** Etiqueta sólo para depurar/leer el código: la capa es decorativa. */
  label: string;
  /**
   * Clases de posición (top/left/right/bottom), tamaño y opacidad. Llevan el
   * juego MÓVIL primero y el de escritorio en variantes `lg:`, en la misma
   * cadena: Tailwind necesita los nombres de clase completos y literales en
   * el código, así que no se pueden componer aparte.
   */
  position: string;
  /** Color de acento del icono. Nombre completo: Tailwind no compone strings. */
  tone: string;
  /** Desfase de la animación para que no floten al unísono. */
  delay: string;
}

/**
 * Capa decorativa de piezas flotantes del hero: cristales con el icono de cada
 * línea del laboratorio, suspendidos alrededor del titular.
 *
 * Es un componente de SERVIDOR a propósito. La animación es la utilidad
 * `animate-float` que ya existe en globals.css (un keyframe de transform), así
 * que no necesita JavaScript: cero bytes de cliente y nada que hidratar en la
 * parte más cara de la página. Un carrusel o una capa con framer-motion aquí
 * habría metido trabajo en el hilo principal justo durante el LCP.
 *
 * Decisiones:
 * - `pointer-events-none` y `aria-hidden`: es adorno. Lo que se puede tocar y
 *   lo que se anuncia son los enlaces reales de la fila de abajo, no esto.
 * - También se ve en móvil, con posiciones y tamaños PROPIOS (ver
 *   `HERO_AURA`). Antes estaba oculto por debajo de `lg` porque a esos anchos
 *   el margen libre es mínimo: la condición para mostrarlo es que las piezas
 *   se apoyen en los bordes, a la altura del titular, sin invadir la columna
 *   de texto ni empujar el ancho de la página. Son más pequeñas y algo más
 *   tenues que en escritorio por el mismo motivo.
 * - El `overflow-hidden` de la sección del hero es la última red: ninguna
 *   pieza puede provocar desplazamiento horizontal aunque se asome al borde.
 * - NO se usa la clase `.glass` aunque el aspecto sea el mismo. `.glass` trae
 *   `backdrop-filter: blur(14px)`, y estas seis piezas se mueven en bucle
 *   infinito: un backdrop-filter que se desplaza obliga al compositor a
 *   volver a muestrear y desenfocar lo que hay debajo EN CADA FOTOGRAMA, seis
 *   veces, encima de las cuatro manchas `blur-3xl` del hero. Es coste de GPU
 *   sostenido durante y después del LCP, y en un portátil con gráfica
 *   integrada se nota. El fondo translúcido con borde da el mismo aspecto de
 *   cristal a coste de un solo pintado, porque detrás no hay contenido que
 *   merezca desenfocarse: sólo el degradado del hero.
 * - `motion-reduce:animate-none`: con reducción de movimiento las piezas se
 *   quedan quietas, pero siguen visibles (son parte de la composición).
 */
export default function HeroAura({ items }: { items: readonly HeroAuraItem[] }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`animate-float absolute motion-reduce:animate-none ${item.position}`}
          style={{ animationDelay: item.delay }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-2xl border border-ml-white/10 bg-ml-white/[0.04]">
            <item.Icon
              className={`h-[55%] w-[55%] ${item.tone}`}
              strokeWidth={1.4}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}

import type { ComponentType, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface HeroAuraItem {
  Icon: IconComponent;
  /** Etiqueta sólo para depurar/leer el código: la capa es decorativa. */
  label: string;
  /** Clases de posición (top/left/right/bottom) y tamaño. */
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
 * - Sólo desde `lg`. En móvil y tablet el ancho útil es el texto; meter piezas
 *   flotantes ahí competiría con el titular y obligaría a bajar su tamaño.
 * - Opacidades bajas (0.30–0.45) y sin blur propio: las manchas de color ya
 *   difuminadas del hero pasan por detrás y dan la profundidad; añadir otro
 *   `blur` encima sería una capa cara sin ganancia visible.
 * - `motion-reduce:animate-none`: con reducción de movimiento las piezas se
 *   quedan quietas, pero siguen visibles (son parte de la composición).
 */
export default function HeroAura({ items }: { items: readonly HeroAuraItem[] }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 hidden lg:block"
      aria-hidden
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`animate-float absolute motion-reduce:animate-none ${item.position}`}
          style={{ animationDelay: item.delay }}
        >
          <div className="glass flex h-full w-full items-center justify-center rounded-2xl">
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

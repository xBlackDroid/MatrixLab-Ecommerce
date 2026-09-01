"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import Link from "next/link";
import type { PointerEvent, ReactNode } from "react";

/**
 * `Link` de Next envuelto en motion. Se crea UNA vez a nivel de módulo: hacerlo
 * dentro del componente devolvería un tipo nuevo en cada render y React
 * desmontaría y volvería a montar el enlace entero cada vez.
 */
const MotionLink = motion.create(Link);

/**
 * Tarjeta de cristal con paralaje al puntero. La usan los accesos de prendas
 * del T-Shirt Lab.
 *
 * Decisiones:
 * - El giro sale de MotionValues con muelle, NO de estado de React: mover el
 *   ratón dispararía un render por cada pixel y en una rejilla de cuatro
 *   tarjetas eso se siente pastoso. Así el trabajo se queda en el compositor.
 * - Sólo reacciona a punteros de RATÓN (`event.pointerType === "mouse"`). En
 *   una pantalla táctil el dedo tapa la tarjeta y el giro no se vería; ahí la
 *   respuesta es el `active:scale` de abajo, que sí se nota.
 * - Con `prefers-reduced-motion` no gira nada: la tarjeta queda plana y
 *   conserva sólo el realce del borde.
 * - El brillo que sigue al cursor es un radial-gradient movido con
 *   MotionValues: sin capas extra ni filtros caros.
 */
export default function TiltCard({
  href,
  children,
  className = "",
  /** Grados máximos de giro. Bajo a propósito: elegante, no de feria. */
  maxTilt = 7,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const reduceMotion = useReducedMotion();

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 22 });

  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(220px circle at ${glowX}% ${glowY}%, rgba(77, 206, 255, 0.18), transparent 70%)`;

  function handlePointerMove(event: PointerEvent<HTMLAnchorElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    // Coordenadas 0..1 dentro de la tarjeta.
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateYRaw.set((px - 0.5) * maxTilt * 2);
    // Signo invertido: el ratón arriba inclina la tarjeta hacia atrás.
    rotateXRaw.set(-(py - 0.5) * maxTilt * 2);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function reset() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glowX.set(50);
    glowY.set(50);
  }

  return (
    // La perspectiva vive en el envoltorio, no en la tarjeta: aplicada sobre el
    // mismo elemento que rota, el giro se vería plano.
    <div style={{ perspective: 900 }} className={className}>
      <MotionLink
        href={href}
        onPointerMove={handlePointerMove}
        onPointerLeave={reset}
        onBlur={reset}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass group relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-3 py-6 transition-colors duration-300 hover:border-ml-cyan/50 focus-visible:border-ml-cyan/60 focus-visible:outline-none active:scale-[0.97]"
      >
        {/* Brillo que sigue al cursor. Aparece sólo en hover para que en
            móvil (donde no hay cursor) no pinte nada. */}
        <motion.span
          aria-hidden
          style={{ backgroundImage: glow }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        {children}
      </MotionLink>
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Palabra que rota para nombrar lo que hace el laboratorio.
 *
 * Por qué esto y no un carrusel de imágenes: la home tiene que decir en dos
 * segundos que aquí se hacen stickers, prendas, tumbler, 3D, láser y etiquetas.
 * Un carrusel exigiría una foto buena por línea y hoy no existen (las carpetas
 * de fotos de prenda están vacías y lo único abundante son fotos de UNA
 * sub-línea), así que representaría mal el negocio. Además las únicas imágenes
 * de marca pesan entre 1 y 2.4 MB: meterlas en la ruta crítica del hero
 * castigaría el LCP justo donde más se nota. Esto no añade ni un byte de
 * imagen y se mantiene solo — la lista sale de la misma constante que los
 * enlaces de abajo.
 *
 * ---------------------------------------------------------------------------
 * Por qué hay una puerta de montaje (`mounted`) y no sólo AnimatePresence
 * ---------------------------------------------------------------------------
 * framer-motion escribe el `initial` como estilo EN LÍNEA durante el render de
 * servidor, así que el HTML llega con `opacity:0`. Si la animación de entrada
 * no corre —y con `AnimatePresence initial={false}` no corre para el primer
 * hijo— ese `opacity:0` se queda pegado y la palabra NO SE VE NUNCA. Pasó
 * exactamente eso en la primera versión de este componente.
 *
 * La puerta lo resuelve de raíz: hasta que el componente monta se pinta la
 * primera palabra como texto normal, sin motion y sin estilos en línea. Eso es
 * además lo que ven quien tiene JS bloqueado y quien pidió reducir movimiento:
 * una palabra legible en vez de un hueco. Sólo después de montar entra
 * AnimatePresence, y ahí las animaciones de entrada ya corren con normalidad.
 */
export default function RotatingWord({
  words,
  intervalMs = 3400,
  className,
}: {
  words: readonly string[];
  intervalMs?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || reduceMotion || words.length < 2) return;
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [mounted, reduceMotion, words.length, intervalMs]);

  const first = words[0] ?? "";
  const current = words[index] ?? first;
  // Reserva de ancho: la palabra más larga mantiene el hueco para que el
  // bloque no cambie de tamaño en cada rotación (cero layout shift).
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  // Antes de montar (y con reducción de movimiento): texto plano, visible.
  if (!mounted || reduceMotion) {
    return (
      <span className={className}>
        <span className="text-gradient">{first}</span>
      </span>
    );
  }

  return (
    <span className={className}>
      {/* Lo que oye un lector de pantalla: la lista entera, una sola vez, en
          vez de un anuncio nuevo cada 3.4 s. */}
      <span className="sr-only">{words.join(", ")}.</span>

      <span aria-hidden className="relative inline-grid overflow-hidden">
        <span className="invisible col-start-1 row-start-1 whitespace-nowrap">
          {longest}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={current}
            initial={{ y: "0.75em", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-0.75em", opacity: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="text-gradient col-start-1 row-start-1 whitespace-nowrap text-left"
          >
            {current}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

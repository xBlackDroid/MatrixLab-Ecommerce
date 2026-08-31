"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Animación sutil de entrada al hacer scroll (estilo laboratorio premium).
 *
 * Es un envoltorio de CLIENTE con hijos de SERVIDOR: lo que envuelve se sigue
 * renderizando en el servidor y sólo el contenedor hidrata. Por eso /tienda y
 * la home lo usan sin volver `use client` sus secciones.
 *
 * La clase `reveal-motion` es el punto de anclaje del respaldo en CSS
 * (globals.css + el <noscript> del layout): framer-motion escribe el estado
 * inicial como estilo EN LÍNEA —`opacity:0` ya viene en el HTML del
 * servidor—, así que sin ese respaldo un usuario con JS bloqueado, o con
 * `prefers-reduced-motion`, se quedaría mirando una sección invisible. Las
 * reglas de respaldo llevan `!important`, que gana sobre el estilo en línea.
 *
 * La clase NO es exclusiva de este componente: la lleva CUALQUIER elemento
 * cuyo estado inicial oculto lo escriba framer-motion. Ver StoreHero, que
 * anima al montar y necesita el mismo respaldo.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className ? `reveal-motion ${className}` : "reveal-motion"}
    >
      {children}
    </motion.div>
  );
}

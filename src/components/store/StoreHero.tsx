"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FlaskConical, Wand2 } from "lucide-react";

export default function StoreHero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-40 left-1/3 h-105 w-105 rounded-full bg-ml-violet/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-ml-cyan/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mb-6 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-violet"
        >
          <FlaskConical className="h-4 w-4" aria-hidden />
          Laboratorio creativo MatrixLab
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-4xl font-bold tracking-tight sm:text-6xl"
        >
          Tienda <span className="text-gradient">MatrixLab</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12 }}
          className="mt-5 max-w-2xl text-lg text-ml-white/85 sm:text-xl"
        >
          Productos personalizados, pedidos especiales y experiencias creativas
          listas para llevar de una pieza hasta miles.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
          className="mt-3 max-w-2xl text-ml-white/60"
        >
          Compra productos personalizados, crea pedidos especiales o diseña
          prendas y accesorios textiles directamente desde nuestro laboratorio
          creativo.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24 }}
          className="mt-9 flex flex-col gap-4 sm:flex-row"
        >
          <Link
            href="/tienda/disenador"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-8 py-4 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:scale-[1.02] hover:bg-ml-violet/90"
          >
            <Wand2 className="h-5 w-5" aria-hidden />
            Diseñar mi prenda
          </Link>
          <a
            href="#catalogo"
            className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition hover:border-ml-cyan/50 hover:text-ml-cyan"
          >
            Explorar catálogo
            <ArrowRight className="h-5 w-5" aria-hidden />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

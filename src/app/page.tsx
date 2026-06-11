/*
 * LANDING PLACEHOLDER.
 *
 * Este repositorio llegó vacío, por lo que la landing real de MatrixLab
 * Intelligence aún no vive aquí. Esta página es un marcador mínimo con el
 * branding oficial cuyo único trabajo es enlazar a la tienda (/tienda).
 *
 * Al integrar la landing real: reemplazar SOLO este archivo y apuntar los
 * botones de tienda/catálogo/productos existentes hacia /tienda.
 */
import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="grid-overlay pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-ml-violet/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-ml-cyan/10 blur-3xl" />

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        <div className="glass mb-8 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-violet">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Laboratorio creativo
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          MatrixLab <span className="text-gradient">Intelligence</span>
        </h1>
        <p className="mt-6 text-xl text-ml-white/80">
          Desde una pieza hasta miles. Desde personas hasta empresas.
        </p>
        <p className="mt-2 text-ml-white/60">
          Un solo ecosistema creativo. Infinitas posibilidades.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-8 py-4 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:scale-[1.03] hover:bg-ml-violet/90"
          >
            Entrar a la tienda
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <Link
            href="/tienda/disenador"
            className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-ml-white transition hover:border-ml-cyan/50 hover:text-ml-cyan"
          >
            Diseñar mi prenda
          </Link>
        </div>
      </div>
    </main>
  );
}

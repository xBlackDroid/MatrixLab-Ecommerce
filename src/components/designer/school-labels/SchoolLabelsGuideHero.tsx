import { ArrowRight, MessageCircle } from "lucide-react";
import {
  SCHOOL_GUIDE_HIGHLIGHTS,
  SCHOOL_GUIDE_STEPS,
} from "@/lib/designer/school-labels/info-content";

/**
 * Hero / guía rápida — fiel a las páginas 1 y 2 de "Cómo Hacer tu Pedido":
 * portada con la insignia MatrixLab Stickers sobre fondo de útiles escolares,
 * título "Cómo hacer tu pedido", paso a paso y resaltados (Elementary/Ultra,
 * add-ons, anticipo, entrega en ~5 días hábiles).
 */

interface SchoolLabelsGuideHeroProps {
  whatsappUrl: string;
}

export default function SchoolLabelsGuideHero({
  whatsappUrl,
}: SchoolLabelsGuideHeroProps) {
  return (
    <section className="flex flex-col gap-5">
      {/* Portada */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-200/60 bg-white">
        {/* Fondo de doodles escolares (suave). */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.13]"
          style={{ backgroundImage: "url(/images/school-labels/backgrounds/doodles.webp)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(243,240,255,0.85) 100%)",
          }}
          aria-hidden
        />

        <div className="relative flex flex-col items-center gap-5 px-5 py-9 text-center sm:px-8 sm:py-12">
          <div className="grid place-items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/school-labels/guide/badge.webp"
              alt="MatrixLab Stickers"
              width={132}
              height={132}
              className="h-28 w-28 drop-shadow-md sm:h-32 sm:w-32"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-500">
              Etiquetas Escolares
            </p>
            <h1 className="mt-1 text-4xl font-black uppercase leading-none tracking-tight text-slate-800 sm:text-5xl">
              Cómo hacer
              <br />
              <span className="text-cyan-400">tu pedido</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-500">
              Una experiencia interactiva para armar tu pack escolar: elige
              diseño, tipografía y colores, o sube tu propia imagen. Simple,
              rápido y sin complicaciones.
            </p>
          </div>

          {/* Resaltados */}
          <div className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SCHOOL_GUIDE_HIGHLIGHTS.map((h) => (
              <div
                key={h.label}
                className="rounded-2xl border border-violet-100 bg-white/80 px-3 py-2.5 backdrop-blur"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-400">
                  {h.label}
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-700">
                  {h.value}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <a
              href="#wizard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition hover:bg-violet-700"
            >
              Empezar mi diseño
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Cotizar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Paso a paso (página 2) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-black text-slate-800">
          Pasos para hacer tu pedido
        </h2>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCHOOL_GUIDE_STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative flex flex-col gap-1.5 rounded-2xl border border-slate-100 bg-gradient-to-br from-violet-50/60 to-white p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xl" aria-hidden>
                  {step.icon}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-700">{step.title}</p>
              <p className="text-xs leading-relaxed text-slate-500">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-2xl bg-cyan-50 px-4 py-2.5 text-xs font-medium text-cyan-700">
          Nota: el paquete <strong>Ultra</strong> puede llevar hasta 2 diseños
          diferentes.
        </p>
      </div>
    </section>
  );
}

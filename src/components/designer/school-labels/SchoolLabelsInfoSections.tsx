"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  SCHOOL_INFO_SECTIONS,
  type InfoSection,
} from "@/lib/designer/school-labels/info-content";
import { cn } from "@/lib/utils";

/**
 * Secciones informativas en acordeón (puntos de entrega, métodos de pago y
 * contacto — páginas 11 a 13 de la guía). Van al final para no estorbar al
 * diseñador. Es contenido de referencia: no toca el checkout real.
 */

export default function SchoolLabelsInfoSections() {
  // El primer acordeón (entregas) abierto por defecto.
  const [open, setOpen] = useState<string | null>(SCHOOL_INFO_SECTIONS[0]?.id ?? null);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-3 sm:p-4">
      <h2 className="px-2 py-3 text-lg font-black text-slate-800">
        Entregas, pagos y contacto
      </h2>
      <div className="flex flex-col gap-2.5">
        {SCHOOL_INFO_SECTIONS.map((section) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={open === section.id}
            onToggle={() =>
              setOpen((cur) => (cur === section.id ? null : section.id))
            }
          />
        ))}
      </div>
    </section>
  );
}

function AccordionItem({
  section,
  isOpen,
  onToggle,
}: {
  section: InfoSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-violet-50/60"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg">
          {section.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-700">
            {section.title}
          </span>
          <span className="block truncate text-xs text-slate-400">
            {section.subtitle}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-slate-400 transition-transform",
            isOpen && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="grid gap-4 border-t border-slate-200 bg-white px-4 py-4 sm:grid-cols-2">
          {section.groups.map((group) => (
            <div key={group.heading}>
              <p className="text-sm font-bold text-violet-600">
                {group.heading}
              </p>
              {group.note && (
                <p className="mt-0.5 text-xs font-semibold text-cyan-600">
                  {group.note}
                </p>
              )}
              <ul className="mt-1.5 flex flex-col gap-1">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-slate-600"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Menu, ShoppingBag, Ticket, X } from "lucide-react";
import {
  MATRIXLAB_TUMBLER_COURSE,
  MATRIXLAB_TUMBLER_COURSE_NAV,
} from "@/lib/store/courses";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  /** Texto que se ve SIEMPRE. En la barra estrecha es lo único que se ve. */
  label: string;
  /**
   * Resto del nombre, que se añade a `label` a partir de `xl` y en el menú
   * móvil. Se guarda por separado —y no el nombre completo— para que las dos
   * mitades no puedan solaparse: el nombre entero es siempre
   * `label + " " + labelRest`, se muestre o no la segunda mitad.
   */
  labelRest?: string;
  /** Ruta real de la app (no un ancla de la home). Lleva ícono y color. */
  route?: boolean;
}

/** Nombre completo de una entrada, con o sin segunda mitad visible. */
function fullLabel(link: NavLink): string {
  return link.labelRest ? `${link.label} ${link.labelRest}` : link.label;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: "/#laboratorio", label: "Laboratorio" },
  { href: "/#tumbler", label: "MatrixLab Tumbler" },
  /*
    Los cursos son la ÚNICA entrada de esta barra que apunta a una página real
    y no a una sección de la home, así que van justo después de la familia a la
    que pertenecen y se distinguen con ícono y color coral.

    En `lg` la barra ya lleva cinco anclas, el logotipo y el botón de tienda:
    ahí el nombre completo la desborda y se muestra "Cursos". A partir de `xl`
    aparece entero, y en el menú móvil se lee siempre completo (`longLabel`).
  */
  {
    href: MATRIXLAB_TUMBLER_COURSE.href,
    label: MATRIXLAB_TUMBLER_COURSE_NAV.label,
    labelRest: MATRIXLAB_TUMBLER_COURSE_NAV.labelRest,
    route: true,
  },
  { href: "/#tshirtlab", label: "T-Shirt Lab" },
  { href: "/#empresas", label: "Empresas" },
  { href: "/#contacto", label: "Contacto" },
];

/** Navbar de la landing principal. La tienda tiene su propio layout. */
export default function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ml-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/*
          Logo MatrixLab. Cuando exista el archivo de logo definitivo
          (SVG/PNG), sustituir el ícono manteniendo el wordmark.
        */}
        {/*
          `shrink-0` y `whitespace-nowrap`: sin ellos el wordmark es lo primero
          que cede cuando la barra va justa y "MatrixLab / Intelligence" cae a
          dos líneas, que estira el header de 64 a 84 px. Que ceda el espaciado
          de la navegación (abajo), nunca la marca.
        */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 whitespace-nowrap"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet shadow-glow-violet">
            <FlaskConical className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">
            MatrixLab <span className="text-gradient">Intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-ml-white/75 lg:flex xl:gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.labelRest ? fullLabel(link) : undefined}
              className={cn(
                "whitespace-nowrap transition",
                link.route
                  ? "flex items-center gap-1.5 hover:text-ml-coral"
                  : "hover:text-ml-violet",
              )}
            >
              {link.route ? <Ticket className="h-4 w-4" aria-hidden /> : null}
              {link.label}
              {link.labelRest ? (
                <span className="hidden xl:inline">{link.labelRest}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/*
            Entre `lg` y `xl` la barra lleva las seis entradas de navegación y
            aquí ya no cabe la frase entera: sin acortarla, el botón parte
            "Ir a la / tienda" en dos renglones. Debajo de `lg` la navegación
            está plegada en la hamburguesa y sobra sitio, así que la frase
            larga sólo se retira en esa banda intermedia. El `aria-label` la
            mantiene completa para lectores de pantalla en todos los anchos.
          */}
          <Link
            href="/tienda"
            aria-label="Ir a la tienda"
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-ml-violet px-5 py-2.5 text-sm font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90 sm:inline-flex"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="inline lg:hidden xl:inline">Ir a la tienda</span>
            <span className="hidden lg:inline xl:hidden">Tienda</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ml-white lg:hidden"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        className={cn(
          "overflow-hidden border-t border-white/10 bg-ml-bg/95 backdrop-blur-xl transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-120" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-ml-white/80 transition hover:bg-white/5",
                link.route ? "hover:text-ml-coral" : "hover:text-ml-violet",
              )}
            >
              {link.route ? <Ticket className="h-4 w-4" aria-hidden /> : null}
              {fullLabel(link)}
            </Link>
          ))}
          <Link
            href="/tienda"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-5 py-3 text-sm font-semibold text-ml-bg"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Ir a la tienda
          </Link>
        </nav>
      </div>
    </header>
  );
}

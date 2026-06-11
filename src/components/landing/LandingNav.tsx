"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Menu, ShoppingBag, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#quienes-somos", label: "Quiénes somos" },
  { href: "/#stickers", label: "Stickers" },
  { href: "/#experiencias", label: "Experiencias" },
  { href: "/#tshirtlab", label: "T-Shirt Lab" },
  { href: "/#empresas", label: "Empresas" },
  { href: "/#tienda", label: "Tienda" },
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
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet shadow-glow-violet">
            <FlaskConical className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">
            MatrixLab <span className="text-gradient">Intelligence</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-ml-white/75 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-ml-violet"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/tienda"
            className="hidden items-center gap-2 rounded-full bg-ml-violet px-5 py-2.5 text-sm font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90 sm:inline-flex"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            Ir a la tienda
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
          open ? "max-h-105" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-2.5 text-ml-white/80 transition hover:bg-white/5 hover:text-ml-violet"
            >
              {link.label}
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

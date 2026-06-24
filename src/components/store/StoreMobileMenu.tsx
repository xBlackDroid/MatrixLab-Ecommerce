"use client";

import { useState } from "react";
import Link from "next/link";
import { Drawer } from "vaul";
import {
  GraduationCap,
  Home,
  Menu,
  MessageCircle,
  Sparkles,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";

/**
 * Menú hamburguesa — SOLO navegación global móvil. El carrito vive fuera de
 * este menú (visible siempre en el header). En escritorio no se usa.
 */

interface StoreMobileMenuProps {
  whatsappUrl: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
}

export default function StoreMobileMenu({ whatsappUrl }: StoreMobileMenuProps) {
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { label: "Inicio", href: "/", icon: Home },
    { label: "Tienda", href: "/tienda", icon: Store },
    { label: "Diseñador", href: "/tienda/disenador", icon: Sparkles },
    {
      label: "Etiquetas escolares",
      href: "/tienda/disenador/etiquetas-escolares",
      icon: GraduationCap,
    },
    { label: "WhatsApp", href: whatsappUrl, icon: MessageCircle, external: true },
  ];

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir menú"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ml-white transition hover:border-ml-violet/60 hover:text-ml-violet md:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="glass-strong fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-5 pb-9">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
          <div className="mb-3 flex items-center justify-between">
            <Drawer.Title className="text-base font-bold">
              MatrixLab <span className="text-gradient">Tienda</span>
            </Drawer.Title>
            <Drawer.Close asChild>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-ml-white/70"
              >
                <X className="h-4.5 w-4.5" aria-hidden />
              </button>
            </Drawer.Close>
          </div>
          <nav className="flex flex-col gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const content = (
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-base font-semibold">{item.label}</span>
                </span>
              );
              const className =
                "flex items-center rounded-2xl border border-white/10 bg-white/5 px-3 py-3 transition hover:border-ml-violet/40 hover:bg-white/10";
              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  {content}
                </Link>
              );
            })}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

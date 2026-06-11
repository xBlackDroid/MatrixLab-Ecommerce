"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  ShoppingCart,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/disenos", label: "Diseños", icon: Palette },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Aunque falle la red, limpiamos navegación.
    }
    toast.success("Sesión cerrada");
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ml-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ml-violet/15 text-ml-violet">
            <FlaskConical className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="hidden text-sm font-bold sm:block">
            MatrixLab <span className="text-ml-violet">Admin</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition",
                  active
                    ? "bg-ml-violet/15 text-ml-violet"
                    : "text-ml-white/65 hover:bg-white/5 hover:text-ml-white",
                )}
              >
                <link.icon className="h-4 w-4" aria-hidden />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-ml-white/65 transition hover:border-ml-coral/40 hover:text-ml-coral"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
}

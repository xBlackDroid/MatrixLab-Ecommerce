"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { trapDialogFocus } from "@/lib/ui/dialog-focus";
import styles from "./mobile-admin.module.css";
import {
  Boxes,
  Calculator,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Package,
  Palette,
  ShoppingCart,
  Store,
  Tags,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /**
   * La ruta es un documento HTML completo (route handler), no una página de
   * React: se navega con <a> normal, sin prefetch de RSC.
   */
  document?: boolean;
};

const LINKS: NavLink[] = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/bazar", label: "Bazar", icon: Store },
  { href: "/admin/cotizador", label: "Cotizador", icon: Calculator, document: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: Tags },
  { href: "/admin/inventario", label: "Inventario", icon: Boxes },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/disenos", label: "Diseños", icon: Palette },
];

export default function AdminNav({ consignmentsEnabled = false }: { consignmentsEnabled?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null), menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId(), menuTitleId = useId();
  const navLinks: NavLink[] = [...LINKS, ...(consignmentsEnabled ? [{ href: "/admin/distribuidores", label: "Distribuidores", icon: Boxes }] : [])];
  const isActive = (link: NavLink) => link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
  const currentPage = navLinks.find(isActive)?.label ?? "Admin";
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    const node = menuRef.current;
    if (!menuOpen || !node) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = menuButtonRef.current;
    node.showModal(); document.body.style.overflow = "hidden";
    (node.querySelector<HTMLElement>('[aria-current="page"]') ?? node.querySelector<HTMLElement>("a"))?.focus();
    return () => { if (node.open) node.close(); document.body.style.overflow = previousOverflow; trigger?.focus(); };
  }, [menuOpen]);

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
      <div className={styles.mobileBar}>
        <Link href="/admin" className={styles.brand}><span className={styles.brandIcon}><FlaskConical size={21} aria-hidden /></span><span><strong>Matrix<span>Lab</span></strong><small>Admin · {currentPage}</small></span></Link>
        <button ref={menuButtonRef} type="button" className={styles.menuTrigger} aria-expanded={menuOpen} aria-controls={menuId} onClick={() => setMenuOpen(true)}><Menu size={20} aria-hidden />Menú</button>
        <button type="button" className={styles.iconButton} aria-label="Cerrar sesión" onClick={() => void handleLogout()}><LogOut size={19} aria-hidden /></button>
      </div>
      <div className={styles.desktopBar + " mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6"}>
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ml-violet/15 text-ml-violet">
            <FlaskConical className="h-4.5 w-4.5" aria-hidden />
          </span>
          <span className="hidden text-sm font-bold sm:block">
            MatrixLab <span className="text-ml-violet">Admin</span>
          </span>
        </Link>

        <nav aria-label="Administración" className="flex min-w-0 items-center gap-1 overflow-x-auto py-1">
          {[...LINKS, ...(consignmentsEnabled ? [{ href: "/admin/distribuidores", label: "Distribuidores", icon: Boxes }] : [])].map((link: NavLink) => {
            const active =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(link.href);
            const className = cn(
              "flex min-h-11 min-w-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition",
              active
                ? "bg-ml-violet/15 text-ml-violet"
                : "text-ml-white/65 hover:bg-white/5 hover:text-ml-white",
            );
            const content = (
              <>
                <link.icon className="h-4 w-4" aria-hidden />
                <span>{link.label}</span>
              </>
            );
            // Conserva las etiquetas visibles del admin publicado.
            return link.document ? (
              <a
                key={link.href}
                href={link.href}
                aria-label={link.label}
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                aria-label={link.label}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 text-sm text-ml-white/65 transition hover:border-ml-coral/40 hover:text-ml-coral"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
      {menuOpen && <dialog ref={menuRef} id={menuId} aria-labelledby={menuTitleId} className={styles.menuPanel} onKeyDown={trapDialogFocus} onCancel={event => { event.preventDefault(); setMenuOpen(false); }} onClick={event => { if (event.target === event.currentTarget) setMenuOpen(false); }}>
        <div className={styles.menuHeading}><div><small>MatrixLab Admin</small><h2 id={menuTitleId}>Ir a sección</h2></div><button type="button" className={styles.iconButton} aria-label="Cerrar menú" onClick={() => setMenuOpen(false)}><X size={20} aria-hidden /></button></div>
        <nav aria-label="Secciones de administración" className={styles.menuGrid}>{navLinks.map(link => { const content = <><link.icon size={19} strokeWidth={1.7} aria-hidden /><span>{link.label}</span></>; const props = { href: link.href, "aria-label": link.label, "aria-current": isActive(link) ? "page" as const : undefined, className: styles.menuLink, onClick: () => setMenuOpen(false) }; return link.document ? <a key={link.href} {...props}>{content}</a> : <Link key={link.href} {...props}>{content}</Link>; })}</nav>
      </dialog>}
    </header>
  );
}

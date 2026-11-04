"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, ShoppingBag, Wand2 } from "lucide-react";
import BackToTop from "./BackToTop";
import styles from "./StoreMobileNavigation.module.css";

export default function StoreMobileNavigation() {
  const pathname = usePathname();
  // Editing and paying already have their own actions; leave the keyboard and submit area clear.
  if (pathname.startsWith("/tienda/checkout") || pathname.startsWith("/tienda/disenador")) return null;
  const links = [
    { href: "/tienda", label: "Tienda", icon: Grid2X2, active: pathname === "/" || pathname === "/tienda" || pathname.startsWith("/tienda/categoria") || pathname.startsWith("/tienda/prendas-listas") },
    { href: "/tienda/disenador", label: "Personalizar", icon: Wand2, active: false },
    { href: "/tienda/carrito", label: "Carrito", icon: ShoppingBag, active: pathname === "/tienda/carrito" },
  ];
  return <nav aria-label="Navegación rápida" className={`store-bottom-nav ${styles.dock}`}>
    <BackToTop inNavigation />
    {links.map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined} className={styles.link}><Icon aria-hidden className="h-5 w-5" />{label}</Link>)}
  </nav>;
}

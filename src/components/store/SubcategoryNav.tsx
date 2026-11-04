"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Drawer } from "vaul";
import { Check, ChevronDown, CupSoda, Droplets, Gift, KeyRound, LayoutGrid, Sparkles, Sticker, Wrench, X } from "lucide-react";
import styles from "./SubcategoryNav.module.css";

const icons = { "vasos-listos": Gift, "repuestos-consumibles": Sparkles, snowglobe: CupSoda, llaveros: KeyRound, "wraps-glow-finish": Sticker, "magic-flow": Droplets, "accesorios-personalizacion": Wrench };
export interface SubcategoryOption { id: string; label: string; href: string; }

/** One compact mobile row, with the same complete choices available in a touch/keyboard drawer. */
export default function SubcategoryNav({ items, selected, label }: { items: SubcategoryOption[]; selected: string; label: string }) {
  const router = useRouter();
  const rail = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [current, select] = useOptimistic(selected);
  const [edges, setEdges] = useState({ left: false, right: true });
  const measure = () => {
    const node = rail.current;
    if (node) setEdges({ left: node.scrollLeft > 1, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1 });
  };
  useEffect(() => {
    const node = rail.current;
    if (!node) return;
    const active = node.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) node.scrollTo({ left: Math.max(0, active.offsetLeft - node.offsetLeft - 6), behavior: "instant" });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [current]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, item: SubcategoryOption) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setOpen(false);
    if (item.id === selected) return;
    startTransition(() => {
      select(item.id);
      router.push(item.href, { scroll: false });
    });
  }

  return <Drawer.Root open={open} onOpenChange={setOpen} autoFocus modal>
    <nav aria-label={label} aria-busy={pending} className={`store-subcategory-nav ${styles.navigation}`}>
      <div ref={rail} onScroll={measure} className={styles.rail} data-fade-left={edges.left} data-fade-right={edges.right}>
        {items.map(item => {
          const Icon = Object.hasOwn(icons, item.id) ? icons[item.id as keyof typeof icons] : null;
          return <Link key={item.id} href={item.href} prefetch={false} onClick={event => navigate(event, item)} aria-current={current === item.id ? "page" : undefined} className={styles.item}>
            {Icon && <Icon className={styles.symbol} strokeWidth={1.65} aria-hidden />}<span>{item.label}</span><Check className={styles.check} aria-hidden />
          </Link>;
        })}
      </div>
      <Drawer.Trigger asChild><button type="button" className={styles.trigger} aria-label="Ver todas las categorías"><LayoutGrid aria-hidden /><span>Categorías</span><ChevronDown aria-hidden className={styles.chevron} /></button></Drawer.Trigger>
    </nav>
    <Drawer.Portal>
      <Drawer.Overlay className={styles.overlay} />
      <Drawer.Content className={styles.drawer}>
        <div className={styles.handle} aria-hidden />
        <div className={styles.drawerHeading}>
          <Drawer.Title className={styles.title}>Categorías Tumbler</Drawer.Title>
          <Drawer.Close asChild><button type="button" aria-label="Cerrar categorías" className={styles.close}><X aria-hidden /></button></Drawer.Close>
        </div>
        <Drawer.Description className="sr-only">Elige una categoría para ver todos sus productos. La selección actual está marcada. Puedes cerrar con Escape.</Drawer.Description>
        <nav aria-label="Todas las categorías de Tumbler" className={styles.options}>
          {items.map(item => {
            const Icon = Object.hasOwn(icons, item.id) ? icons[item.id as keyof typeof icons] : null;
            return <Link key={item.id} href={item.href} prefetch={false} onClick={event => navigate(event, item)} aria-current={current === item.id ? "page" : undefined} className={styles.option}>
              {Icon && <Icon aria-hidden strokeWidth={1.65} />}<span>{item.label}</span><Check className={styles.check} aria-hidden />
            </Link>;
          })}
        </nav>
      </Drawer.Content>
    </Drawer.Portal>
  </Drawer.Root>;
}

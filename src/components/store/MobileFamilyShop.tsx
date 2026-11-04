"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, Search, Wand2, X } from "lucide-react";
import BrandWordmark from "./BrandWordmark";
import Image from "./StoreImage";
import AddToCartButton from "./AddToCartButton";
import ProductImagePlaceholder from "./ProductImagePlaceholder";
import type { MobileFamilyProduct, MobileStoreFamily } from "@/lib/store/mobile-families";
import { formatPrice } from "@/lib/utils";
import styles from "./MobileFamilyShop.module.css";
import { READY_WEAR_TYPES, type ReadyWearType } from "@/lib/store/ready-wear";
import { defaultReadyGarmentColor, readyGarmentColors, readyGarmentColorImage, readyGarmentColorSlug, type ReadyGarmentColor } from "@/lib/store/ready-garment-colors";

const external = (href: string) => href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {};

export default function MobileFamilyShop({ families }: { families: MobileStoreFamily[] }) {
  const [active, setActive] = useState(families[0].id);
  const page = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sections = [...(page.current?.querySelectorAll<HTMLElement>("[data-family-block]") ?? [])];
    const observer = new IntersectionObserver(() => {
      const current = [...sections].reverse().find((section) => section.getBoundingClientRect().top <= 150);
      if (current) setActive(current.dataset.familyBlock as MobileStoreFamily["id"]);
    }, { rootMargin: "-120px 0px -55% 0px", threshold: [0, 1] });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return <div ref={page} className={`mobile-storefront ${styles.page}`}>
    <div className={styles.intro}><h1 className={styles.heading}>Tienda MatrixLab</h1></div>
    <nav className={styles.jumpNav} aria-label="Líneas MatrixLab">
      {families.map((family) => <a key={family.id} href={`#mobile-family-${family.id}`} data-line={family.id} aria-current={active === family.id ? "location" : undefined} onClick={(event) => {
        event.preventDefault(); setActive(family.id);
        document.getElementById(`mobile-family-${family.id}`)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }} className={styles.jumpLink}><BrandWordmark family={family.id} label={family.id === "escolar" ? "Escolar" : family.title} compact /></a>)}
    </nav>
    <div className={styles.families}>
      {families.map((family) => <FamilyBlock key={family.id} family={family} />)}
    </div>
  </div>;
}

function FamilyBlock({ family }: { family: MobileStoreFamily }) {
  const [selected, setSelected] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wearType, setWearType] = useState<ReadyWearType>("sudaderas");
  const input = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const id = useId();
  const shelf = family.shelves[selected];
  const fullCategoryHref = family.id === "wear" && shelf?.id === "prendas" ? `/tienda/prendas-listas?tipo=${wearType}` : selected === 0 ? family.href : shelf?.href ?? family.href;
  const products = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return (shelf?.products ?? []).filter((product) => (!term || product.title.toLocaleLowerCase("es").includes(term)) && (family.id !== "wear" || shelf?.id !== "prendas" || product.wearType === wearType));
  }, [shelf, query, wearType, family.id]);
  useEffect(() => { if (searchOpen) input.current?.focus(); }, [searchOpen]);
  function closeSearch() { setSearchOpen(false); setQuery(""); searchButton.current?.focus(); }
  function switchShelf(index: number) { setSelected(index); setQuery(""); }
  function onTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % family.shelves.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + family.shelves.length) % family.shelves.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = family.shelves.length - 1;
    else return;
    event.preventDefault(); switchShelf(next);
    tabs.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }
  return <section id={`mobile-family-${family.id}`} data-family-block={family.id} data-line={family.id} className={styles.family} aria-labelledby={`${id}-title`}>
    <header className={styles.familyHeader}>
      <h2 id={`${id}-title`} className={styles.familyTitle}><BrandWordmark family={family.id} label={family.title} /></h2>
      {shelf && <Link href={fullCategoryHref} className={styles.collectionLink} aria-label={selected === 0 ? `Ver todo ${family.title}` : `Ver ${shelf.label.toLocaleLowerCase("es")}`}>Ver todo<ArrowRight className="h-4 w-4" aria-hidden /></Link>}
      {shelf && <button ref={searchButton} type="button" className={styles.iconButton} aria-label={`Buscar en MatrixLab ${family.title}`} aria-expanded={searchOpen} onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}><Search className="h-5 w-5" aria-hidden /></button>}
    </header>
    <p className={shelf ? "sr-only" : styles.description}>{family.description}</p>
    {family.shelves.length > 1 && <div ref={tabs} role="tablist" aria-label={`Colecciones de MatrixLab ${family.title}`} className={styles.tabs}>
      {family.shelves.map((item, index) => <button key={item.id} type="button" role="tab" id={`${id}-tab-${index}`} aria-selected={selected === index} aria-controls={`${id}-panel`} tabIndex={selected === index ? 0 : -1} onKeyDown={(event) => onTabKey(event, index)} onClick={() => switchShelf(index)} className={styles.tab}>{item.label}</button>)}
    </div>}
    {family.id === "wear" && shelf?.id === "prendas" && <div role="group" aria-label="Tipos de prenda en Wear" className={styles.wearTypes}>{READY_WEAR_TYPES.map(type => <button type="button" key={type.id} aria-pressed={wearType === type.id} onClick={() => { setWearType(type.id); setQuery(""); }}>{type.label}</button>)}</div>}
    {searchOpen && shelf && <div className={styles.search}>
      <label htmlFor={`${id}-search`} className="sr-only">Buscar en {family.title}: {shelf.label}</label>
      <input ref={input} id={`${id}-search`} type="search" value={query} placeholder={`Buscar en ${shelf.label.toLocaleLowerCase("es")}`} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); closeSearch(); } }} />
      <button type="button" aria-label={`Cerrar búsqueda de ${family.title}`} className={styles.iconButton} onClick={closeSearch}><X className="h-4 w-4" aria-hidden /></button>
    </div>}
    {shelf ? <div id={`${id}-panel`} role={family.shelves.length > 1 ? "tabpanel" : undefined} aria-labelledby={family.shelves.length > 1 ? `${id}-tab-${selected}` : `${id}-title`} className={styles.panel}>
      <p className="sr-only" role="status" aria-live="polite">{family.title}, {shelf.label}: {products.length} productos{query ? ` para ${query}` : ""}</p>
      {products.length > 0 ? <ProductCarousel key={`${shelf.id}-${query}-${wearType}`} products={products} family={family} /> : <div className={styles.empty}>
        <p>{shelf.failed ? "No pudimos cargar esta colección." : query ? "No encontramos ese diseño." : "Estamos preparando esta colección."}</p>
        {query ? <button type="button" onClick={() => setQuery("")} className={styles.primaryLink}>Limpiar búsqueda</button> : <Link href={shelf.href} className={styles.primaryLink}>{shelf.failed ? "Reintentar" : "Ver colección"}<ArrowRight aria-hidden className="h-4 w-4" /></Link>}
      </div>}
      {family.links.length > 0 && <div className={styles.familyFooter}>
        <details className={styles.more}>
          <summary>Más opciones<ChevronDown className="h-4 w-4" aria-hidden /></summary>
          <nav aria-label={`Más de MatrixLab ${family.title}`} className={styles.extraLinks}>{family.links.map((link) => <Link key={link.href} href={link.href} {...external(link.href)}>{link.label}<ArrowRight className="h-4 w-4" aria-hidden /></Link>)}</nav>
        </details>
      </div>}
    </div> : <div className={styles.services}>
      {family.id === "escolar" && <Link href={family.href} className={styles.schoolStory}><Image brand="escolar" src="/images/school-labels/guide/supplies.webp" alt="Etiquetas y útiles escolares personalizados" fill sizes="(max-width: 639px) 100vw, 1px" className="object-cover" /></Link>}
      {family.links.map((link, index) => <Link key={link.href} href={link.href} {...external(link.href)} className={index === 0 ? styles.primaryLink : styles.secondaryLink}>{index === 0 && <Wand2 aria-hidden className="h-4 w-4" />}{link.label}<ArrowRight aria-hidden className="h-4 w-4" /></Link>)}
    </div>}
  </section>;
}

function ProductCarousel({ products, family }: { products: MobileFamilyProduct[]; family: MobileStoreFamily }) {
  const rail = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState({ index: 0, atEnd: products.length <= 2 });
  const visible = products.slice(0, 8);
  const id = useId();
  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const update = () => {
      const first = element.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(element).columnGap) || 12;
      const next = { index: Math.round(element.scrollLeft / ((first?.offsetWidth ?? 1) + gap)), atEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 };
      setPosition((current) => current.index === next.index && current.atEnd === next.atEnd ? current : next);
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(element);
    return () => resize.disconnect();
  }, [products.length]);
  function move(direction: number) {
    const element = rail.current;
    if (element) element.scrollBy({ left: direction * (element.clientWidth + 12), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  function onScroll() {
    const element = rail.current;
    const first = element?.firstElementChild as HTMLElement | null;
    if (!element || !first) return;
    const gap = parseFloat(getComputedStyle(element).columnGap) || 12;
    const next = { index: Math.round(element.scrollLeft / (first.offsetWidth + gap)), atEnd: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 };
    setPosition((current) => current.index === next.index && current.atEnd === next.atEnd ? current : next);
  }
  return <div className={styles.carousel} role="region" aria-label={`Productos de MatrixLab ${family.title}`} aria-roledescription="carrusel">
    <ul ref={rail} id={id} onScroll={onScroll} className={styles.rail} data-family-products={family.id}>
      {visible.map((product, index) => <li key={product.id} className={styles.slide}><FamilyProduct product={product} family={family} index={index} /></li>)}
    </ul>
    <div className={styles.carouselControls}>
      <div className={styles.arrows}><button type="button" className={styles.iconButton} aria-label={`Productos anteriores de ${family.title}`} aria-controls={id} disabled={position.index === 0} onClick={() => move(-1)}><ChevronLeft aria-hidden className="h-5 w-5" /></button><button type="button" className={styles.iconButton} aria-label={`Más productos de ${family.title}`} aria-controls={id} disabled={position.atEnd} onClick={() => move(1)}><ChevronRight aria-hidden className="h-5 w-5" /></button></div>
    </div>
  </div>;
}

function FamilyProduct({ product, family, index }: { product: MobileFamilyProduct; family: MobileStoreFamily; index: number }) {
  const handle = product.wearHandle;
  const colors = handle ? readyGarmentColors(handle) : [];
  const [color, setColor] = useState<ReadyGarmentColor | null>(handle ? defaultReadyGarmentColor(handle) : null);
  const image = handle && color ? readyGarmentColorImage(handle, color) ?? product.image : product.image;
  const href = handle && color && colors.length ? `${product.href}?color=${readyGarmentColorSlug(handle, color)}` : product.href;
  return <article className={styles.product} data-product-family={family.id}>
        <Link href={href} {...external(href)} className={styles.photo} aria-label={`Ver ${product.title}`}>
          {image ? <Image brand={family.brand} src={image} alt={product.title} fill sizes="(max-width: 639px) 44vw, 1px" priority={family.id === "tumbler" && index < 2} className="object-cover" /> : <ProductImagePlaceholder title={product.title} />}
        </Link>
        {handle && colors.length > 0 && <div role="group" aria-label={`Color de ${product.title}`} className={styles.colors}>{colors.map(option => {
          const thumbnail = readyGarmentColorImage(handle, option.label);
          return thumbnail && <button key={option.slug} type="button" aria-pressed={option.label === color} aria-label={`Ver ${product.title} en color ${option.label}`} onClick={() => setColor(option.label)}><span className={styles.colorPhoto}><Image brand="wear" src={thumbnail} alt="" fill sizes="32px" className="object-cover" /></span></button>;
        })}</div>}
        <div className={styles.productInfo}>
          <Link href={href} {...external(href)} className={styles.productTitle}><h3>{product.title}</h3></Link>
          <div className={styles.priceRow}><div className={styles.pricing}><p className={`${styles.price} ui-money mobile-product-price`}>{product.price === null ? <span className={styles.pricePending}>{product.priceNote ? "Precio al diseñar" : "Por cotización"}</span> : formatPrice(product.price)}</p>{(product.priceNote || product.unit === "planilla") && <p className={styles.unit}>{product.priceNote ?? "por planilla"}</p>}</div>
          {product.quickBuy && <AddToCartButton productId={product.quickBuy.productId} variantId={product.quickBuy.variantId} quantity={1} iconOnly label={`Agregar ${product.title} al carrito`} className={styles.quickAdd} />}</div>
        </div>
      </article>;
}

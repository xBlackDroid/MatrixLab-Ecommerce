import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Building2,
  CupSoda,
  Droplets,
  Gift,
  GraduationCap,
  Magnet,
  Package,
  PartyPopper,
  Shirt,
  Sparkles,
  Sticker,
  User,
  Zap,
} from "lucide-react";
import {
  CapIcon,
  HoodieIcon,
  ToteIcon,
} from "@/components/icons/GarmentIcons";
import StoreFamilySection, {
  FamilyWatermark,
} from "@/components/store/StoreFamilySection";
import StoreCTA from "@/components/store/StoreCTA";
import StoreHero from "@/components/store/StoreHero";

const VOLUME_ITEMS = [
  {
    icon: User,
    title: "Compra individual",
    text: "Una sola pieza, hecha para ti, con acabado premium.",
  },
  {
    icon: Gift,
    title: "Regalos personalizados",
    text: "Detalles únicos para sorprender a quien más quieres.",
  },
  {
    icon: PartyPopper,
    title: "Pedidos para eventos",
    text: "Bodas, cumpleaños, graduaciones y activaciones completas.",
  },
  {
    icon: Building2,
    title: "Pedidos empresariales",
    text: "Equipos, uniformes y merchandising con tu marca.",
  },
  {
    icon: Package,
    title: "Producción por volumen",
    text: "De decenas a miles de piezas con calidad consistente.",
  },
  {
    icon: Sparkles,
    title: "Solicitudes especiales",
    text: "¿Una idea fuera de catálogo? La aterrizamos contigo.",
  },
];

// Prendas del laboratorio, cada una con su icono específico (no genérico).
// Mismos tipos/rutas que usaba el bloque "T-Shirt Lab": /tienda/disenador/<type>.
const PRENDA_LAB_ITEMS: Array<{
  label: string;
  type: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { label: "Playera", type: "playera", Icon: Shirt },
  { label: "Sudadera", type: "sudadera", Icon: HoodieIcon },
  { label: "Gorra", type: "gorra", Icon: CapIcon },
  { label: "Tote bag", type: "tote", Icon: ToteIcon },
];

// Plantillas reales del Laboratorio láser (src/lib/designer/laser-config.ts):
// el láser es un solo lienzo, no tiene rutas propias por material, así que se
// muestran como opciones informativas (no como links) en vez de inventar
// navegación falsa.
const LASER_CHIPS = [
  { label: "Tabla de madera" },
  { label: "Placa acrílica" },
  { label: "Termo" },
  { label: "Tag" },
];

export default function TiendaHomePage() {
  return (
    <>
      <StoreHero />

      {/* 1. Grandes bloques de familias MatrixLab */}
      <StoreFamilySection
        id="catalogo"
        accent="cyan"
        badgeIcon={CupSoda}
        badgeLabel="Línea creativa"
        title={
          <>
            MatrixLab <span className="text-gradient">Tumbler</span>
          </>
        }
        description="Vasos, materiales e insumos creativos para personalizar tumblers, snow globe y proyectos únicos."
        ctaLabel="Explorar MatrixLab Tumbler"
        ctaHref="/tienda/categoria/matrixlab-tumbler"
        blurSide="left"
        backgroundLogo={{
          kind: "image",
          src: "/images/categories/matrixlab-tumbler.png",
        }}
        right={{
          kind: "items",
          items: [
            { label: "Vasos", href: "/tienda/categoria/snowglobe", icon: CupSoda },
            {
              label: "Sparkles",
              href: "/tienda/categoria/repuestos-consumibles",
              icon: Sparkles,
            },
            {
              label: "UV Stickers",
              href: "/tienda/categoria/wraps-glow-finish",
              icon: Sticker,
            },
            {
              label: "Magic Flow",
              href: "/tienda/categoria/magic-flow",
              icon: Droplets,
            },
          ],
        }}
      />

      <StoreFamilySection
        accent="coral"
        badgeIcon={Sticker}
        badgeLabel="Personalización"
        title={
          <>
            MatrixLab <span className="text-gradient">Stickers</span>
          </>
        }
        description="Stickers e imanes personalizados para marcas, eventos, regalos, colecciones y proyectos creativos."
        ctaLabel="Explorar MatrixLab Stickers"
        ctaHref="/tienda/categoria/stickers"
        blurSide="right"
        backgroundLogo={{ kind: "icon", icon: Sticker }}
        right={{
          kind: "items",
          items: [
            { label: "Stickers", href: "/tienda/categoria/stickers", icon: Sticker },
            { label: "Imanes", href: "/tienda/categoria/imanes", icon: Magnet },
          ],
        }}
      />

      <StoreFamilySection
        accent="violet"
        badgeIcon={Shirt}
        badgeLabel="Prendas"
        title={
          <>
            MatrixLab <span className="text-gradient">Wear</span>
          </>
        }
        description="Playeras, gorras y prendas personalizadas para personas, equipos, eventos y marcas."
        ctaLabel="Diseñar mi prenda"
        ctaHref="/tienda/disenador"
        blurSide="left"
        backgroundLogo={{ kind: "icon", icon: Shirt }}
        right={{
          kind: "items",
          items: PRENDA_LAB_ITEMS.map((item) => ({
            label: item.label,
            href: `/tienda/disenador/${item.type}`,
            icon: item.Icon,
          })),
        }}
      />

      <StoreFamilySection
        accent="green"
        badgeIcon={Box}
        badgeLabel="Fabricación digital"
        title={
          <>
            MatrixLab <span className="text-gradient">3D</span>
          </>
        }
        description="Impresión 3D, prototipos, decoración y productos personalizados creados capa por capa."
        ctaLabel="Explorar MatrixLab 3D"
        ctaHref="/tienda/categoria/impresion-3d"
        blurSide="right"
        backgroundLogo={{
          kind: "image",
          src: "/images/categories/impresion-3d.png",
        }}
        right={{ kind: "none" }}
      />

      <StoreFamilySection
        accent="violet"
        badgeIcon={Zap}
        badgeLabel="Corte & grabado"
        title={
          <>
            MatrixLab <span className="text-gradient">Laser</span>
          </>
        }
        description="Grabado y corte personalizado en madera, acrílico y materiales especiales para piezas y regalos únicos."
        ctaLabel="Explorar MatrixLab Laser"
        ctaHref="/tienda/disenador/laser"
        blurSide="left"
        backgroundLogo={{ kind: "icon", icon: Zap }}
        right={{ kind: "chips", heading: "Disponible en el diseñador", items: LASER_CHIPS }}
      />

      {/* 2. Regreso a clases — Etiquetas Escolares Lab (sección dedicada,
          sin cambios de copy/CTA/ruta/lógica; solo se reubica dentro del
          nuevo sistema de bloques). */}
      <section className="px-4 pb-20 pt-6 sm:px-6">
        <div className="glass relative mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-3xl p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-ml-violet/10 blur-3xl" />
          {/* Watermark de marca, mismo lenguaje visual que los bloques de arriba. */}
          <FamilyWatermark logo={{ kind: "icon", icon: GraduationCap }} />
          <div className="relative">
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
              <GraduationCap className="h-4 w-4" aria-hidden />
              Regreso a clases
            </span>
            <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
              Etiquetas <span className="text-gradient">Escolares Lab</span>
            </h2>
            <p className="mt-3 max-w-xl text-ml-white/65">
              Arma tu pedido con nombre, tipografía, colores y temática en pocos
              pasos. Packs personalizados para útiles, loncheras, termos,
              cuadernos y regreso a clases.
            </p>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/tienda/disenador/etiquetas-escolares"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-cyan px-7 py-3.5 font-semibold text-ml-bg shadow-glow-cyan transition hover:scale-[1.02] hover:bg-ml-cyan/90"
            >
              Crear etiquetas escolares
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <Link
              href="/tienda/categoria/etiquetas-escolares"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-ml-white/85 transition hover:border-white/30"
            >
              Ver categoría
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Desde una pieza hasta miles */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">
            Desde una pieza <span className="text-gradient">hasta miles</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-ml-white/60">
            Desde personas hasta empresas. Un solo ecosistema creativo.
            Infinitas posibilidades.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VOLUME_ITEMS.map((item) => (
              <div key={item.title} className="glass rounded-2xl p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet">
                  <item.icon className="h-5.5 w-5.5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-ml-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CTA final */}
      <StoreCTA />
    </>
  );
}

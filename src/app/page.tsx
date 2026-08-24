import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  CupSoda,
  FlaskConical,
  GraduationCap,
  MessageCircle,
  Shirt,
  ShoppingBag,
  Sparkles,
  Sticker,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { CapIcon, HoodieIcon, ToteIcon } from "@/components/icons/GarmentIcons";
import FamilyCard, {
  type FamilyAccent,
} from "@/components/landing/FamilyCard";
import LandingNav from "@/components/landing/LandingNav";
import Reveal from "@/components/landing/Reveal";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "MatrixLab Intelligence — Laboratorio creativo",
  description:
    "Desde una pieza hasta miles. Desde personas hasta empresas. Stickers, prendas personalizadas, experiencias creativas y producción por volumen en un solo ecosistema.",
  openGraph: {
    title: "MatrixLab Intelligence — Laboratorio creativo",
    description:
      "Un solo ecosistema creativo. Infinitas posibilidades. Productos personalizados para personas, eventos y empresas.",
    type: "website",
    locale: "es_MX",
    siteName: "MatrixLab Intelligence",
  },
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Chips del hero (estructura de la landing original de
 * pagina-matrix-lab-principal). Todas las rutas existen en la tienda actual.
 */
const HERO_CHIPS: Array<{ label: string; href: string }> = [
  { label: "Únicos", href: "/tienda" },
  { label: "Merchandising", href: "/tienda" },
  { label: "T-Shirt Lab", href: "/tienda/disenador" },
  { label: "Colecciones", href: "/tienda/categoria/stickers" },
  { label: "Stickers", href: "/tienda/categoria/stickers" },
  { label: "Imanes", href: "/tienda/categoria/imanes" },
  { label: "Playeras", href: "/tienda/disenador/playera" },
  { label: "Gorras", href: "/tienda/disenador/gorra-clasica" },
];

/**
 * Seis familias MatrixLab de la sección "El laboratorio". Todas comparten el
 * mismo sistema visual (ver FamilyCard), tomado 1:1 de las cards que ya
 * funcionaban en la home: MatrixLab Tumbler y Etiquetas escolares.
 *
 * Stickers agrupa Stickers + Imanes, y Apparel agrupa Playeras + Gorras: esas
 * cuatro rutas siguen vivas, solo dejan de tener tarjeta propia en la home.
 */
const FAMILY_CARDS: Array<{
  id: string;
  href: string;
  badgeIcon: IconComponent;
  badgeLabel: string;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  cta: string;
  accent: FamilyAccent;
  gradient: string;
  visual:
    | { kind: "image"; src: string }
    | { kind: "icon"; icon: IconComponent };
  /** Ancla para preservar los enlaces existentes de nav/footer (#tumbler). */
  anchorId?: string;
}> = [
  {
    id: "stickers",
    href: "/tienda/categoria/stickers",
    badgeIcon: Sticker,
    badgeLabel: "Personalización",
    titlePrefix: "MatrixLab",
    titleHighlight: "Stickers",
    description:
      "Stickers e imanes personalizados para marcas, eventos, colecciones y proyectos creativos.",
    cta: "Explorar la línea",
    accent: "coral",
    gradient: "from-ml-coral/20 via-ml-violet/10 to-transparent",
    visual: { kind: "icon", icon: Sticker },
  },
  {
    id: "apparel",
    href: "/tienda/disenador",
    badgeIcon: Shirt,
    badgeLabel: "Prendas",
    titlePrefix: "MatrixLab",
    titleHighlight: "Apparel",
    description:
      "Playeras, gorras y prendas personalizadas para personas, equipos, eventos y marcas.",
    cta: "Explorar la línea",
    accent: "violet",
    gradient: "from-ml-violet/20 via-ml-cyan/10 to-transparent",
    visual: { kind: "icon", icon: Shirt },
  },
  {
    id: "tumbler",
    href: "/tienda/categoria/matrixlab-tumbler",
    badgeIcon: CupSoda,
    badgeLabel: "Línea creativa",
    titlePrefix: "MatrixLab",
    titleHighlight: "Tumbler",
    description:
      "Vasos, termos, snow globe e insumos creativos para personalización.",
    cta: "Explorar la línea",
    accent: "cyan",
    gradient: "from-ml-cyan/20 via-ml-violet/10 to-transparent",
    visual: { kind: "image", src: "/images/categories/matrixlab-tumbler.png" },
    anchorId: "tumbler",
  },
  {
    id: "3d",
    // Nombre público de marca, alineado con /tienda. El handle y la ruta
    // /tienda/categoria/impresion-3d no cambian.
    href: "/tienda/categoria/impresion-3d",
    badgeIcon: Box,
    badgeLabel: "Fabricación digital",
    titlePrefix: "MatrixLab",
    titleHighlight: "3D",
    description:
      "Impresión 3D, prototipos, decoración y productos personalizados creados capa por capa.",
    cta: "Explorar 3D",
    accent: "green",
    gradient: "from-ml-cyan/20 via-ml-green/10 to-transparent",
    visual: { kind: "image", src: "/images/categories/impresion-3d.png" },
  },
  {
    id: "laser",
    href: "/tienda/disenador/laser",
    badgeIcon: Zap,
    badgeLabel: "Corte & grabado",
    titlePrefix: "MatrixLab",
    titleHighlight: "Laser",
    description:
      "Grabado y corte personalizado en madera, acrílico y materiales especiales.",
    cta: "Explorar Laser",
    accent: "violet",
    gradient: "from-ml-violet/20 via-ml-coral/10 to-transparent",
    visual: { kind: "icon", icon: Zap },
  },
  {
    id: "etiquetas-escolares",
    href: "/tienda/disenador/etiquetas-escolares",
    badgeIcon: GraduationCap,
    badgeLabel: "De regreso a clases",
    titlePrefix: "Etiquetas",
    titleHighlight: "escolares",
    description:
      "Paquetes personalizados con tipografías y diseños editables, listos para ropa, útiles y más.",
    cta: "Crear etiquetas",
    accent: "green",
    gradient: "from-ml-green/20 via-ml-coral/10 to-transparent",
    visual: { kind: "icon", icon: GraduationCap },
  },
];

// Prendas del laboratorio (T-Shirt Lab) con su icono específico, no genérico.
const PRENDA_TILES: Array<{
  label: string;
  type: string;
  Icon: IconComponent;
}> = [
  { label: "Playera", type: "playera", Icon: Shirt },
  { label: "Sudadera", type: "sudadera", Icon: HoodieIcon },
  { label: "Gorra", type: "gorra", Icon: CapIcon },
  { label: "Tote bag", type: "tote", Icon: ToteIcon },
];

export default function LandingPage() {
  return (
    <>
      <LandingNav />

      <main className="pt-16">
        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
          <div className="grid-overlay pointer-events-none absolute inset-0" />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-130 -translate-x-1/2 rounded-full bg-ml-violet/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-ml-cyan/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-10 left-0 h-72 w-72 rounded-full bg-ml-coral/10 blur-3xl" />
          <div className="pointer-events-none absolute right-16 top-24 h-56 w-56 rounded-full bg-ml-green/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-violet">
                <FlaskConical className="h-4 w-4" aria-hidden />
                Laboratorio creativo premium
              </span>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-7 text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl">
                MatrixLab
                <br />
                <span className="text-gradient">Intelligence</span>
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-7 text-xl font-medium text-ml-white/90 sm:text-2xl">
                Desde una pieza hasta miles.
                <br />
                Desde personas hasta empresas.
              </p>
              <p className="mt-3 text-ml-white/60 sm:text-lg">
                Un solo ecosistema creativo. Infinitas posibilidades.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href={buildWhatsAppUrl(whatsappMessages.quoteDesign())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-green px-8 py-4 text-base font-semibold text-ml-bg shadow-glow-green transition hover:scale-[1.03] hover:bg-ml-green/90"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Cotizar por WhatsApp
                </a>
                <Link
                  href="/tienda"
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition hover:border-ml-cyan/50 hover:text-ml-cyan"
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  Ver catálogo
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24} className="w-full">
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
                {HERO_CHIPS.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="glass rounded-full px-4 py-2 text-sm font-medium text-ml-white/75 transition hover:-translate-y-0.5 hover:border-ml-violet/50 hover:text-ml-violet"
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= LABORATORIO (6 familias, cards grandes) ================= */}
        <section id="laboratorio" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-violet">
                  El laboratorio
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  ¿Qué quieres <span className="text-gradient">crear hoy?</span>
                </h2>
                <p className="mt-5 text-ml-white/65">
                  Stickers, prendas, vasos y termos, impresión 3D, grabado
                  láser y etiquetas escolares: todo se diseña y se produce en
                  el mismo laboratorio, desde una pieza hasta miles.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {FAMILY_CARDS.map((card, index) => {
                const cardEl = (
                  <Reveal delay={index * 0.06} className="h-full">
                    <FamilyCard
                      href={card.href}
                      badgeIcon={card.badgeIcon}
                      badgeLabel={card.badgeLabel}
                      titlePrefix={card.titlePrefix}
                      titleHighlight={card.titleHighlight}
                      description={card.description}
                      cta={card.cta}
                      accent={card.accent}
                      gradient={card.gradient}
                      visual={
                        card.visual.kind === "image"
                          ? { kind: "image", src: card.visual.src }
                          : { kind: "icon", Icon: card.visual.icon }
                      }
                    />
                  </Reveal>
                );
                // El wrapper con id preserva el ancla #tumbler existente en
                // nav/footer sin tocar esos componentes.
                return card.anchorId ? (
                  <div
                    key={card.id}
                    id={card.anchorId}
                    className="h-full scroll-mt-24"
                  >
                    {cardEl}
                  </div>
                ) : (
                  <div key={card.id} className="h-full">
                    {cardEl}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= T-SHIRT LAB ================= */}
        <section id="tshirtlab" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="glass-strong relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-9 sm:p-14">
            <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-ml-cyan/15 blur-3xl" />

            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <Reveal>
                <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
                  <Wand2 className="h-4 w-4" aria-hidden />
                  T-Shirt Lab
                </span>
                <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                  Diseña tu prenda{" "}
                  <span className="text-gradient">en el laboratorio</span>
                </h2>
                <p className="mt-4 max-w-lg text-ml-white/65">
                  Nuestro diseñador interactivo te deja crear prendas y
                  accesorios textiles con tu propia imagen, en minutos y desde
                  cualquier dispositivo.
                </p>

                <ul className="mt-7 flex flex-col gap-3.5">
                  {[
                    {
                      icon: Upload,
                      text: "Sube tu imagen PNG (también JPG o WEBP)",
                    },
                    {
                      icon: Wand2,
                      text: "Acomódala: mueve, escala y rota dentro del área segura",
                    },
                    {
                      icon: CheckCircle2,
                      text: "Agrégala al carrito lista para producir con acabado premium",
                    },
                  ].map((step) => (
                    <li key={step.text} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ml-cyan/15 text-ml-cyan">
                        <step.icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm text-ml-white/75 sm:text-base">
                        {step.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/tienda/disenador"
                  className="mt-9 inline-flex items-center gap-2 rounded-full bg-ml-cyan px-8 py-4 font-semibold text-ml-bg shadow-glow-cyan transition hover:scale-[1.02] hover:bg-ml-cyan/90"
                >
                  Abrir diseñador
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {PRENDA_TILES.map((item) => (
                    <Link
                      key={item.type}
                      href={`/tienda/disenador/${item.type}`}
                      className="glass group flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 transition hover:-translate-y-0.5 hover:border-ml-cyan/50"
                    >
                      <item.Icon className="h-6 w-6 text-ml-violet transition group-hover:text-ml-cyan" />
                      <span className="text-xs font-semibold sm:text-sm">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= PERSONAS Y EMPRESAS ================= */}
        <section id="empresas" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-violet">
                  Personas y empresas
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Desde una pieza{" "}
                  <span className="text-gradient">hasta miles</span>
                </h2>
                <p className="mt-5 text-ml-white/65">
                  Misma calidad y mismos acabados profesionales en la pieza 1 y
                  en la pieza 1,000. Esa es la promesa del laboratorio.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              <Reveal className="h-full">
                <div className="glass relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8 sm:p-10">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ml-coral/15 blur-3xl"
                    aria-hidden
                  />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-ml-coral/15 text-ml-coral">
                    <Sparkles className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="relative mt-5 text-2xl font-bold">
                    Únicos y momentos especiales
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-ml-white/65 sm:text-base">
                    Piezas únicas, regalos personalizados, bodas, XV años,
                    graduaciones y colecciones propias. Te acompañamos desde el
                    primer boceto hasta la entrega.
                  </p>
                  <a
                    href={buildWhatsAppUrl(
                      "Hola MatrixLab, quiero cotizar una pieza única o un regalo personalizado.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative mt-auto inline-flex w-fit items-center gap-2 pt-7 font-semibold text-ml-coral transition hover:gap-3"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    Cotizar mi idea
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.08} className="h-full">
                <div className="glass relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8 sm:p-10">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ml-violet/15 blur-3xl"
                    aria-hidden
                  />
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-ml-violet/15 text-ml-violet">
                    <Building2 className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="relative mt-5 text-2xl font-bold">
                    Merchandising y volumen
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-ml-white/65 sm:text-base">
                    Uniformes, kits, material para eventos y producción por
                    volumen para empresas, escuelas y marcas, con atención
                    directa y tiempos claros de entrega.
                  </p>
                  <a
                    href={buildWhatsAppUrl(
                      "Hola MatrixLab, quiero cotizar un pedido para mi empresa.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative mt-auto inline-flex w-fit items-center gap-2 pt-7 font-semibold text-ml-violet transition hover:gap-3"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    Cotizar para mi empresa
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= CONTACTO ================= */}
        <section id="contacto" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="glass relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-ml-green/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-ml-violet/15 blur-3xl" />

            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-ml-cyan">
                Contacto
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Hablemos de tu{" "}
                <span className="text-gradient">próxima pieza</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-ml-white/65">
                ¿Tienes una idea, un evento o un pedido especial? Escríbenos
                por WhatsApp y te respondemos con propuesta y cotización clara.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={buildWhatsAppUrl(whatsappMessages.customRequest())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-ml-green px-8 py-4 font-semibold text-ml-bg shadow-glow-green transition hover:scale-[1.02] hover:bg-ml-green/90"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Cotizar por WhatsApp
                </a>
                <Link
                  href="/tienda"
                  className="glass inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold transition hover:border-white/30"
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  Ver catálogo
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-6 text-center">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet">
                <FlaskConical className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-lg font-bold">
                MatrixLab <span className="text-gradient">Intelligence</span>
              </span>
            </div>
            <p className="max-w-md text-sm text-ml-white/55">
              Desde una pieza hasta miles. Desde personas hasta empresas. Un
              solo ecosistema creativo. Infinitas posibilidades.
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-ml-white/60">
              <Link href="/#laboratorio" className="hover:text-ml-violet">
                Laboratorio
              </Link>
              <Link href="/#tumbler" className="hover:text-ml-cyan">
                MatrixLab Tumbler
              </Link>
              <Link href="/#tshirtlab" className="hover:text-ml-cyan">
                T-Shirt Lab
              </Link>
              <Link href="/#empresas" className="hover:text-ml-violet">
                Empresas
              </Link>
              <Link href="/tienda" className="hover:text-ml-coral">
                Tienda
              </Link>
              <Link href="/tienda/disenador" className="hover:text-ml-cyan">
                Diseñador
              </Link>
              <a
                href={buildWhatsAppUrl(whatsappMessages.customRequest())}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ml-green"
              >
                WhatsApp
              </a>
            </nav>
            <p className="text-xs text-ml-white/35">
              © {new Date().getFullYear()} MatrixLab Intelligence. Laboratorio
              creativo.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}

import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  CupSoda,
  FlaskConical,
  GraduationCap,
  Magnet,
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
 * Cards grandes del laboratorio: las seis líneas del sitio original, cada una
 * con su icono y acento propio (cyan, morado, rosa, verde), adaptadas a la
 * identidad actual. Las clases de acento van completas en los datos porque
 * Tailwind necesita los nombres estáticos.
 */
const LAB_CARDS: Array<{
  title: string;
  description: string;
  href: string;
  icon: IconComponent;
  cta: string;
  accentText: string;
  iconClasses: string;
  gradient: string;
  hover: string;
}> = [
  {
    title: "Stickers",
    description:
      "Resistentes al agua, con corte perfecto y acabados profesionales. Para marcas, empaques, laptops, eventos y colecciones.",
    href: "/tienda/categoria/stickers",
    icon: Sticker,
    cta: "Ver stickers",
    accentText: "text-ml-coral",
    iconClasses: "bg-ml-coral/15 text-ml-coral",
    gradient: "from-ml-coral/25 via-ml-coral/5 to-transparent",
    hover: "hover:border-ml-coral/50 hover:shadow-glow-coral",
  },
  {
    title: "Imanes",
    description:
      "Imanes personalizados para refrigerador, recuerdos de eventos, marcas y promociones que la gente conserva.",
    href: "/tienda/categoria/imanes",
    icon: Magnet,
    cta: "Ver imanes",
    accentText: "text-ml-cyan",
    iconClasses: "bg-ml-cyan/15 text-ml-cyan",
    gradient: "from-ml-cyan/25 via-ml-cyan/5 to-transparent",
    hover: "hover:border-ml-cyan/50 hover:shadow-glow-cyan",
  },
  {
    title: "Playeras",
    description:
      "Diséñalas en el T-Shirt Lab con tu propia imagen: mueve, escala y rota tu diseño con acabado premium.",
    href: "/tienda/disenador/playera",
    icon: Shirt,
    cta: "Diseñar playera",
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-violet/5 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    title: "Gorras",
    description:
      "Gorras personalizadas para eventos, marcas, equipos y activaciones, listas para diseñar en el laboratorio.",
    href: "/tienda/disenador/gorra-clasica",
    icon: CapIcon,
    cta: "Diseñar gorra",
    accentText: "text-ml-green",
    iconClasses: "bg-ml-green/15 text-ml-green",
    gradient: "from-ml-green/25 via-ml-green/5 to-transparent",
    hover: "hover:border-ml-green/50 hover:shadow-glow-green",
  },
  {
    title: "Grabado Láser",
    description:
      "Madera, acrílico, metal y materiales especiales grabados con precisión para piezas y regalos únicos.",
    href: "/tienda/disenador/laser",
    icon: Zap,
    cta: "Cotizar grabado",
    accentText: "text-ml-violet",
    iconClasses: "bg-ml-violet/15 text-ml-violet",
    gradient: "from-ml-violet/25 via-ml-coral/10 to-transparent",
    hover: "hover:border-ml-violet/50 hover:shadow-glow-violet",
  },
  {
    title: "Impresión 3D",
    description:
      "Piezas únicas, prototipos, decoración y objetos personalizados construidos capa por capa.",
    href: "/tienda/categoria/impresion-3d",
    icon: Box,
    cta: "Ver impresión 3D",
    accentText: "text-ml-green",
    iconClasses: "bg-ml-green/15 text-ml-green",
    gradient: "from-ml-cyan/20 via-ml-green/10 to-transparent",
    hover: "hover:border-ml-green/50 hover:shadow-glow-green",
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

        {/* ================= LABORATORIO (cards grandes) ================= */}
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
                  Stickers, imanes, prendas, gorras, grabado láser e impresión
                  3D: todo se diseña y se produce en el mismo laboratorio,
                  desde una pieza hasta miles.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {LAB_CARDS.map((card, index) => (
                <Reveal key={card.title} delay={index * 0.06} className="h-full">
                  <Link
                    href={card.href}
                    className={`glass group relative flex h-full min-h-60 flex-col justify-between overflow-hidden rounded-[1.75rem] p-7 transition hover:-translate-y-1.5 ${card.hover}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-80 transition group-hover:opacity-100`}
                      aria-hidden
                    />
                    <card.icon
                      className={`pointer-events-none absolute -bottom-7 -right-7 h-40 w-40 ${card.accentText} opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.16]`}
                      aria-hidden
                    />
                    <span
                      className={`relative flex h-14 w-14 items-center justify-center rounded-2xl ${card.iconClasses}`}
                    >
                      <card.icon className="h-7 w-7" aria-hidden />
                    </span>
                    <div className="relative mt-6">
                      <h3 className="text-2xl font-bold">{card.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ml-white/65">
                        {card.description}
                      </p>
                      <span
                        className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${card.accentText}`}
                      >
                        {card.cta}
                        <ArrowRight
                          className="h-4 w-4 transition group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MATRIXLAB TUMBLER + ETIQUETAS ESCOLARES ============ */}
        <section id="tumbler" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
            <Reveal className="h-full">
              <Link
                href="/tienda/categoria/matrixlab-tumbler"
                className="glass group relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition hover:-translate-y-1 hover:border-ml-cyan/50 hover:shadow-glow-cyan sm:p-10"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-cyan/20 via-ml-violet/10 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-12 -right-8 h-64 w-64 opacity-25 transition duration-300 group-hover:scale-105 group-hover:opacity-40"
                  aria-hidden
                >
                  <Image
                    src="/images/categories/matrixlab-tumbler.png"
                    alt=""
                    fill
                    sizes="256px"
                    className="object-contain"
                  />
                </div>
                <span className="glass relative inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
                  <CupSoda className="h-4 w-4" aria-hidden />
                  Línea creativa
                </span>
                <div className="relative mt-8 max-w-sm">
                  <h3 className="text-3xl font-bold">
                    MatrixLab <span className="text-gradient">Tumbler</span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ml-white/70 sm:text-base">
                    Vasos, termos, snow globe e insumos creativos para
                    personalización.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-ml-cyan">
                    Explorar la línea
                    <ArrowRight
                      className="h-5 w-5 transition group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </Reveal>

            <Reveal delay={0.08} className="h-full">
              <Link
                href="/tienda/disenador/etiquetas-escolares"
                className="glass group relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition hover:-translate-y-1 hover:border-ml-green/50 hover:shadow-glow-green sm:p-10"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-green/20 via-ml-coral/10 to-transparent"
                  aria-hidden
                />
                <GraduationCap
                  className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 text-ml-green opacity-[0.08] transition duration-300 group-hover:scale-110 group-hover:opacity-[0.16]"
                  aria-hidden
                />
                <span className="glass relative inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-green">
                  <GraduationCap className="h-4 w-4" aria-hidden />
                  De regreso a clases
                </span>
                <div className="relative mt-8 max-w-sm">
                  <h3 className="text-3xl font-bold">
                    Etiquetas <span className="text-gradient">escolares</span>
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ml-white/70 sm:text-base">
                    Paquetes personalizados con tipografías y diseños
                    editables, listos para ropa, útiles y más.
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-ml-green">
                    Crear etiquetas
                    <ArrowRight
                      className="h-5 w-5 transition group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </div>
              </Link>
            </Reveal>
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

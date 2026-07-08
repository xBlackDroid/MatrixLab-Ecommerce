import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Building2,
  CheckCircle2,
  FlaskConical,
  Gift,
  GraduationCap,
  Heart,
  Layers,
  Magnet,
  MessageCircle,
  PartyPopper,
  Rocket,
  Shirt,
  ShoppingBag,
  Sticker,
  Upload,
  Users,
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

const PILLARS = [
  {
    icon: FlaskConical,
    title: "Laboratorio creativo",
    text: "Ideas, diseño y producción viven en el mismo lugar: tu proyecto no se pierde entre proveedores.",
  },
  {
    icon: Layers,
    title: "Producción flexible",
    text: "Una pieza única o miles para tu marca, con la misma calidad y acabados profesionales.",
  },
  {
    icon: Heart,
    title: "Acompañamiento cercano",
    text: "Te ayudamos a aterrizar la idea por WhatsApp, desde el primer boceto hasta la entrega.",
  },
];

const EXPERIENCES = [
  {
    icon: PartyPopper,
    title: "Eventos",
    text: "Bodas, XV años, graduaciones y festivales con recuerdos hechos a la medida.",
  },
  {
    icon: Gift,
    title: "Regalos personalizados",
    text: "Piezas únicas para sorprender: prendas, stickers, imanes y detalles especiales.",
  },
  {
    icon: Rocket,
    title: "Activaciones de marca",
    text: "Kits, merchandising y material creativo para lanzamientos y campañas.",
  },
  {
    icon: Users,
    title: "Equipos y comunidades",
    text: "Playeras y gorras para equipos deportivos, escuelas, colectivos y staff.",
  },
];

const COMPANY_BULLETS = [
  "Equipos y uniformes con tu marca",
  "Merchandising y regalos corporativos",
  "Material para eventos y activaciones",
  "Producción por volumen con calidad consistente",
  "Atención directa y tiempos claros de entrega",
];

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const STORE_CATEGORIES: Array<{
  handle: string;
  label: string;
  icon: IconComponent;
}> = [
  { handle: "stickers", label: "Stickers", icon: Sticker },
  { handle: "etiquetas-escolares", label: "Etiquetas escolares", icon: GraduationCap },
  { handle: "imanes", label: "Imanes", icon: Magnet },
  { handle: "playeras-prendas", label: "Playeras y prendas", icon: Shirt },
  { handle: "gorras", label: "Gorras", icon: CapIcon },
  { handle: "grabado-laser", label: "Grabado láser", icon: Zap },
  { handle: "impresion-3d", label: "Impresión 3D", icon: Box },
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

/**
 * Banners configurables de la sección de stickers en la home. Cada slot es un
 * rectángulo flotante que puede mostrar una imagen/banner, título, subtítulo y
 * enlace. Si no hay `image`, se muestra el estado por defecto (icono + texto).
 *
 * CÓMO CAMBIAR LOS BANNERS (sin admin):
 *   1. Sube la imagen a `public/images/home/sticker-banners/` (ver README ahí).
 *   2. Añade el campo `image` (y opcionalmente `href`) al banner de abajo:
 *        image: "/images/home/sticker-banners/marcas.webp"
 *   Mientras no haya `image`, se usa el fallback con icono — nada se rompe.
 */
type StickerFeatureBanner = {
  title: string;
  subtitle?: string;
  /**
   * Ruta pública de la imagen/banner (empieza en `/images/...`). Súbela a
   * `public/images/home/sticker-banners/`. Si se omite, se usa el fallback.
   */
  image?: string;
  /** Enlace opcional al hacer clic en el banner. */
  href?: string;
};

const stickerFeatureBanners: StickerFeatureBanner[] = [
  {
    title: "Marcas y empaques",
    subtitle: "Stickers, etiquetas y empaques con tu identidad.",
    // image: "/images/home/sticker-banners/marcas.webp",
    href: "/tienda/categoria/stickers",
  },
  {
    title: "Eventos y campañas",
    subtitle: "Activaciones, ferias y campañas memorables.",
    // image: "/images/home/sticker-banners/eventos.webp",
    href: "/tienda/categoria/stickers",
  },
  {
    title: "Colecciones propias",
    subtitle: "Lanza tu propia línea de stickers coleccionables.",
    // image: "/images/home/sticker-banners/colecciones.webp",
    href: "/tienda/categoria/stickers",
  },
  {
    title: "Regalos y detalles",
    subtitle: "Detalles personalizados que la gente conserva.",
    // image: "/images/home/sticker-banners/regalos.webp",
    href: "/tienda/categoria/stickers",
  },
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
                Desde una pieza hasta miles. Desde personas hasta empresas.
              </p>
              <p className="mt-2 text-ml-white/60 sm:text-lg">
                Un solo ecosistema creativo. Infinitas posibilidades.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/tienda"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-8 py-4 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:scale-[1.03] hover:bg-ml-violet/90"
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  Explorar la tienda
                </Link>
                <Link
                  href="/tienda/disenador"
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition hover:border-ml-cyan/50 hover:text-ml-cyan"
                >
                  <Wand2 className="h-5 w-5" aria-hidden />
                  Diseñar mi prenda
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.24} className="w-full">
              <div className="mt-14 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Desde 1 pieza", caption: "sin mínimos imposibles" },
                  { label: "Hasta miles", caption: "producción por volumen" },
                  { label: "Todo en un lugar", caption: "diseño + producción" },
                ].map((stat) => (
                  <div key={stat.label} className="glass rounded-2xl p-4 sm:p-5">
                    <p className="text-sm font-bold text-ml-cyan sm:text-lg">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xs text-ml-white/50 sm:text-sm">
                      {stat.caption}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= QUIÉNES SOMOS ================= */}
        <section id="quienes-somos" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-violet">
                  Quiénes somos
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Un laboratorio donde las ideas{" "}
                  <span className="text-gradient">se vuelven piezas reales</span>
                </h2>
                <p className="mt-5 text-ml-white/65">
                  MatrixLab Intelligence es un laboratorio creativo: combinamos
                  diseño, personalización premium y producción flexible para que
                  cualquier persona, evento o empresa pueda crear productos con
                  identidad propia, sin complicarse.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {PILLARS.map((pillar, index) => (
                <Reveal key={pillar.title} delay={index * 0.08}>
                  <div className="glass h-full rounded-3xl p-7 transition hover:border-ml-violet/40">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ml-violet/15 text-ml-violet">
                      <pillar.icon className="h-6 w-6" aria-hidden />
                    </span>
                    <h3 className="mt-5 text-lg font-bold">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ml-white/60">
                      {pillar.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= MATRIXLAB STICKERS ================= */}
        <section id="stickers" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="glass relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-9 sm:p-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ml-coral/15 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-2">
              <Reveal>
                <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-coral">
                  <Sticker className="h-4 w-4" aria-hidden />
                  MatrixLab Stickers
                </span>
                <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                  Stickers que le ponen{" "}
                  <span className="text-gradient">personalidad a todo</span>
                </h2>
                <p className="mt-4 max-w-lg text-ml-white/65">
                  Resistentes al agua, con acabados profesionales y el corte
                  perfecto para tu diseño. Ideales para marcas, empaques,
                  laptops, botellas, eventos y colecciones — desde una pieza
                  hasta miles.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/tienda/categoria/stickers"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-coral px-7 py-3.5 font-semibold text-ml-bg transition hover:scale-[1.02] hover:bg-ml-coral/90"
                  >
                    Ver stickers en la tienda
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </Link>
                  <a
                    href={buildWhatsAppUrl(
                      "Hola MatrixLab, quiero cotizar stickers personalizados.",
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold transition hover:border-ml-coral/40 hover:text-ml-coral"
                  >
                    <MessageCircle className="h-5 w-5" aria-hidden />
                    Cotizar por WhatsApp
                  </a>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="grid grid-cols-2 gap-4">
                  {stickerFeatureBanners.map((banner, index) => {
                    const content = (
                      <div
                        className="glass animate-float relative flex h-full min-h-[132px] flex-col items-center justify-center overflow-hidden rounded-2xl p-5 text-center"
                        style={{ animationDelay: `${index * 0.9}s` }}
                      >
                        {banner.image ? (
                          <>
                            {/* Banner: imagen de fondo + velo para legibilidad. */}
                            <span
                              className="absolute inset-0 bg-cover bg-center"
                              style={{ backgroundImage: `url(${banner.image})` }}
                              aria-hidden
                            />
                            <span
                              className="absolute inset-0 bg-gradient-to-t from-ml-bg/85 via-ml-bg/45 to-transparent"
                              aria-hidden
                            />
                          </>
                        ) : (
                          // Fallback: icono + texto (estado por defecto).
                          <Sticker
                            className="relative h-7 w-7 text-ml-coral/80"
                            aria-hidden
                          />
                        )}
                        <div className="relative mt-3">
                          <p className="text-sm font-semibold">{banner.title}</p>
                          {banner.subtitle && (
                            <p className="mt-1 text-xs text-ml-white/65">
                              {banner.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                    return banner.href ? (
                      <Link
                        key={banner.title}
                        href={banner.href}
                        className="block h-full transition hover:-translate-y-1 hover:border-ml-coral/40"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={banner.title} className="h-full">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ================= EXPERIENCIAS ================= */}
        <section id="experiencias" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-cyan">
                  Experiencias
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Momentos que se quedan{" "}
                  <span className="text-gradient">en algo tangible</span>
                </h2>
                <p className="mt-5 text-ml-white/65">
                  No solo producimos piezas: ayudamos a que tus eventos, regalos
                  y lanzamientos se sientan únicos con productos personalizados
                  que la gente quiere conservar.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {EXPERIENCES.map((experience, index) => (
                <Reveal key={experience.title} delay={index * 0.07}>
                  <div className="glass h-full rounded-3xl p-6 transition hover:-translate-y-1 hover:border-ml-cyan/40">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ml-cyan/15 text-ml-cyan">
                      <experience.icon className="h-5.5 w-5.5" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-bold">{experience.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ml-white/60">
                      {experience.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.15}>
              <p className="mt-10 text-center">
                <a
                  href={buildWhatsAppUrl(
                    "Hola MatrixLab, quiero cotizar productos personalizados para un evento.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-semibold text-ml-cyan transition hover:gap-3"
                >
                  Cuéntanos tu evento por WhatsApp
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </p>
            </Reveal>
          </div>
        </section>

        {/* ================= T-SHIRT LAB ================= */}
        <section id="tshirtlab" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="glass-strong relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] p-9 sm:p-14">
            <div className="grid-overlay pointer-events-none absolute inset-0 opacity-60" />
            <div className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-ml-cyan/15 blur-3xl" />

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

        {/* ================= EMPRESAS ================= */}
        <section id="empresas" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <span className="text-sm font-semibold uppercase tracking-widest text-ml-violet">
                Empresas
              </span>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Tu marca, multiplicada{" "}
                <span className="text-gradient">con calidad de laboratorio</span>
              </h2>
              <p className="mt-5 max-w-lg text-ml-white/65">
                Acompañamos a negocios, escuelas e instituciones en pedidos
                recurrentes y producción por volumen: mismos acabados
                profesionales en la pieza 1 y en la pieza 1,000.
              </p>
              <ul className="mt-7 flex flex-col gap-3">
                {COMPANY_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-ml-violet"
                      aria-hidden
                    />
                    <span className="text-ml-white/80">{bullet}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href={buildWhatsAppUrl(
                    "Hola MatrixLab, quiero cotizar un pedido para mi empresa.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-7 py-3.5 font-semibold text-ml-bg shadow-glow-violet transition hover:bg-ml-violet/90"
                >
                  <Building2 className="h-5 w-5" aria-hidden />
                  Cotizar para mi empresa
                </a>
                <Link
                  href="/tienda"
                  className="glass inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-semibold transition hover:border-white/30"
                >
                  Ver catálogo
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="glass relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ml-violet/15 blur-3xl" />
                <div className="relative flex flex-col gap-4">
                  {[
                    {
                      title: "Pedido individual",
                      caption: "1 pieza personalizada",
                      width: "w-1/4",
                    },
                    {
                      title: "Evento",
                      caption: "50–300 piezas",
                      width: "w-2/4",
                    },
                    {
                      title: "Empresa",
                      caption: "300–1,000 piezas",
                      width: "w-3/4",
                    },
                    {
                      title: "Volumen",
                      caption: "1,000+ piezas",
                      width: "w-full",
                    },
                  ].map((tier) => (
                    <div key={tier.title}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold">{tier.title}</span>
                        <span className="text-ml-white/50">{tier.caption}</span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-ml-violet to-ml-cyan ${tier.width}`}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="mt-3 text-center text-xs text-ml-white/45">
                    Misma calidad en cualquier escala. Esa es la promesa.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= TIENDA ================= */}
        <section id="tienda" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-coral">
                  Tienda
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Todo el laboratorio,{" "}
                  <span className="text-gradient">a un clic</span>
                </h2>
                <p className="mt-5 text-ml-white/65">
                  Compra en línea con pago seguro vía Mercado Pago: catálogo
                  personalizable, pedidos sobre demanda y el diseñador T-Shirt
                  Lab integrado.
                </p>
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {STORE_CATEGORIES.map((category, index) => (
                <Reveal key={category.handle} delay={index * 0.05}>
                  <Link
                    href={`/tienda/categoria/${category.handle}`}
                    className="glass group flex h-full flex-col items-center gap-3 rounded-2xl px-4 py-7 text-center transition hover:-translate-y-1 hover:border-ml-violet/40 hover:shadow-glow-violet"
                  >
                    <category.icon
                      className="h-7 w-7 text-ml-violet transition group-hover:text-ml-cyan"
                      aria-hidden
                    />
                    <span className="text-sm font-semibold leading-tight">
                      {category.label}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.2}>
              <div className="mt-10 text-center">
                <Link
                  href="/tienda"
                  className="inline-flex items-center gap-2 rounded-full bg-ml-violet px-9 py-4 text-base font-semibold text-ml-bg shadow-glow-violet transition hover:scale-[1.02] hover:bg-ml-violet/90"
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  Entrar a la tienda
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= CONTACTO ================= */}
        <section id="contacto" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="glass relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-ml-cyan/10 blur-3xl" />
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
                ¿Tienes una idea, un evento o un pedido especial? Escríbenos por
                WhatsApp y te respondemos con propuesta y cotización clara.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={buildWhatsAppUrl(whatsappMessages.customRequest())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-ml-cyan px-8 py-4 font-semibold text-ml-bg shadow-glow-cyan transition hover:scale-[1.02] hover:bg-ml-cyan/90"
                >
                  <MessageCircle className="h-5 w-5" aria-hidden />
                  Escribir por WhatsApp
                </a>
                <Link
                  href="/tienda"
                  className="glass inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold transition hover:border-white/30"
                >
                  Comprar en línea
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
              <Link href="/#quienes-somos" className="hover:text-ml-violet">
                Quiénes somos
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
                className="hover:text-ml-coral"
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

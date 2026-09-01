import type { ComponentType, SVGProps } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Box,
  Boxes,
  Building2,
  CheckCircle2,
  CupSoda,
  Factory,
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
import HeroAura, { type HeroAuraItem } from "@/components/landing/HeroAura";
import LandingNav from "@/components/landing/LandingNav";
import Reveal from "@/components/landing/Reveal";
import RotatingWord from "@/components/landing/RotatingWord";
import TiltCard from "@/components/landing/TiltCard";
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
 * Las seis líneas del laboratorio. FUENTE ÚNICA del hero: de aquí salen las
 * palabras que rota el titular, los accesos de la fila y las piezas flotantes.
 *
 * Tenerlo en un solo sitio es lo que hace barato mantener el hero: añadir una
 * línea nueva (o renombrarla) la mete a la vez en los tres sitios y nunca deja
 * el texto rotando diciendo algo que la fila de abajo ya no ofrece.
 *
 * Sustituye a los chips genéricos anteriores ("Únicos", "Merchandising",
 * "Colecciones"), que no nombraban un producto y apuntaban todos a /tienda o a
 * stickers. Ningún destino se pierde: los que tenían ruta propia siguen aquí.
 */
const LAB_LINES: Array<{
  /** Palabra que se ve rotando en el titular. */
  word: string;
  /** Etiqueta del acceso (más corta y concreta que la palabra del titular). */
  label: string;
  href: string;
  Icon: IconComponent;
  tone: string;
}> = [
  {
    word: "stickers",
    label: "Stickers",
    href: "/tienda/categoria/stickers",
    Icon: Sticker,
    tone: "text-ml-coral",
  },
  {
    word: "prendas personalizadas",
    label: "Prendas",
    href: "/tienda/disenador",
    Icon: Shirt,
    tone: "text-ml-violet",
  },
  {
    word: "tumbler y termos",
    label: "Tumbler",
    href: "/tienda/categoria/matrixlab-tumbler",
    Icon: CupSoda,
    tone: "text-ml-cyan",
  },
  {
    word: "impresión 3D",
    label: "Impresión 3D",
    href: "/tienda/categoria/impresion-3d",
    Icon: Box,
    tone: "text-ml-green",
  },
  {
    word: "grabado láser",
    label: "Láser",
    href: "/tienda/disenador/laser",
    Icon: Zap,
    tone: "text-ml-violet",
  },
  {
    word: "etiquetas escolares",
    label: "Etiquetas escolares",
    href: "/tienda/disenador/etiquetas-escolares",
    Icon: GraduationCap,
    tone: "text-ml-green",
  },
];

/**
 * Piezas flotantes del hero. Posiciones elegidas para dejar libre la columna
 * central de texto (max-w-4xl): tres por banda, alternando tamaño y altura para
 * que la composición no quede simétrica ni alineada como una rejilla.
 */
const HERO_AURA: readonly HeroAuraItem[] = [
  {
    Icon: Sticker,
    label: "stickers",
    position: "left-[4%] top-[18%] h-20 w-20 opacity-40",
    tone: "text-ml-coral",
    delay: "0s",
  },
  {
    Icon: CupSoda,
    label: "tumbler",
    position: "left-[9%] top-[54%] h-16 w-16 opacity-30",
    tone: "text-ml-cyan",
    delay: "1.4s",
  },
  {
    Icon: Shirt,
    label: "prendas",
    position: "left-[2%] bottom-[14%] h-24 w-24 opacity-35",
    tone: "text-ml-violet",
    delay: "2.6s",
  },
  {
    Icon: Box,
    label: "3d",
    position: "right-[5%] top-[15%] h-24 w-24 opacity-40",
    tone: "text-ml-green",
    delay: "0.7s",
  },
  {
    Icon: Zap,
    label: "laser",
    position: "right-[11%] top-[52%] h-16 w-16 opacity-30",
    tone: "text-ml-violet",
    delay: "2s",
  },
  {
    Icon: GraduationCap,
    label: "etiquetas",
    position: "right-[3%] bottom-[16%] h-20 w-20 opacity-35",
    tone: "text-ml-green",
    delay: "3.2s",
  },
];

/**
 * Seis familias MatrixLab de la sección "El laboratorio". Todas comparten el
 * mismo sistema visual (ver FamilyCard), tomado 1:1 de las cards que ya
 * funcionaban en la home: MatrixLab Tumbler y Etiquetas escolares.
 *
 * Stickers agrupa Stickers + Imanes, y Wear agrupa Playeras + Gorras: esas
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
    visual: { kind: "image", src: "/images/categories/matrixlab-stickers.png" },
  },
  {
    id: "wear",
    href: "/tienda/disenador",
    badgeIcon: Shirt,
    badgeLabel: "Prendas",
    titlePrefix: "MatrixLab",
    titleHighlight: "Wear",
    description:
      "Playeras, gorras y prendas personalizadas para personas, equipos, eventos y marcas.",
    cta: "Explorar la línea",
    accent: "violet",
    gradient: "from-ml-violet/20 via-ml-cyan/10 to-transparent",
    visual: { kind: "image", src: "/images/categories/matrixlab-wear.png" },
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
    visual: { kind: "image", src: "/images/categories/matrixlab-laser.png" },
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
    visual: {
      kind: "image",
      src: "/images/categories/etiquetas-escolares.png",
    },
  },
];

/**
 * Las cuatro capacidades del laboratorio, dichas como verbos. Van sobre las dos
 * tarjetas de público: primero qué hacemos, después para quién.
 */
const CAPABILITIES: Array<{
  label: string;
  Icon: IconComponent;
  tone: string;
}> = [
  { label: "Diseñamos", Icon: Wand2, tone: "text-ml-violet" },
  { label: "Producimos", Icon: Factory, tone: "text-ml-cyan" },
  { label: "Personalizamos", Icon: Sparkles, tone: "text-ml-coral" },
  { label: "Entregamos por volumen", Icon: Boxes, tone: "text-ml-green" },
];

/**
 * Los dos frentes del negocio. Se pasan a datos (antes eran dos bloques de JSX
 * casi idénticos) para que la única diferencia entre las tarjetas sea el
 * contenido y no haya que tocar dos marcados en paralelo cada vez que cambie el
 * estilo.
 *
 * Las clases de color van completas por acento: Tailwind necesita ver el nombre
 * literal en el código, no puede resolver `text-ml-${tone}`.
 */
const AUDIENCE_CARDS: Array<{
  id: string;
  Icon: IconComponent;
  title: string;
  description: string;
  useCases: readonly string[];
  cta: string;
  whatsapp: string;
  tone: string;
  badgeBg: string;
  orb: string;
  gradient: string;
  hoverBorder: string;
  chipBorder: string;
}> = [
  {
    id: "personas",
    Icon: Sparkles,
    title: "Piezas únicas y momentos que importan",
    description:
      "Regalos personalizados, bodas, XV años, graduaciones y colecciones propias. Te acompañamos desde el primer boceto hasta la entrega — y si sólo necesitas una pieza, también es tu lugar.",
    useCases: [
      "Regalos",
      "Bodas y XV",
      "Graduaciones",
      "Colecciones propias",
      "Piezas de autor",
    ],
    cta: "Cotizar mi idea",
    whatsapp:
      "Hola MatrixLab, quiero cotizar una pieza única o un regalo personalizado.",
    tone: "text-ml-coral",
    badgeBg: "bg-ml-coral/15",
    orb: "bg-ml-coral/15",
    gradient: "from-ml-coral/15 via-ml-violet/5 to-transparent",
    hoverBorder: "hover:border-ml-coral/50 hover:shadow-glow-coral",
    chipBorder: "border-ml-coral/25",
  },
  {
    id: "empresas",
    Icon: Building2,
    title: "Merchandising, marca y producción por volumen",
    description:
      "Uniformes, kits de bienvenida, material para eventos, activaciones y campañas para empresas, escuelas y marcas. Cotización por volumen, muestra previa y tiempos de entrega comprometidos por escrito.",
    useCases: [
      "Uniformes",
      "Kits de bienvenida",
      "Activaciones",
      "Eventos y ferias",
      "Campañas",
      "Escuelas",
    ],
    cta: "Cotizar para mi empresa",
    whatsapp:
      "Hola MatrixLab, quiero cotizar un pedido por volumen para mi empresa o marca.",
    tone: "text-ml-violet",
    badgeBg: "bg-ml-violet/15",
    orb: "bg-ml-violet/15",
    gradient: "from-ml-violet/15 via-ml-cyan/5 to-transparent",
    hoverBorder: "hover:border-ml-violet/50 hover:shadow-glow-violet",
    chipBorder: "border-ml-violet/25",
  },
];

/**
 * Prendas del laboratorio (T-Shirt Lab) con su icono específico, no genérico.
 *
 * `offset` es el desfase vertical que arma la composición en diagonal a partir
 * de `sm`. Es una clase completa y no un valor calculado porque Tailwind no
 * puede ver nombres construidos con plantillas.
 *
 * En móvil no se aplica ningún desfase: con dos columnas estrechas, escalonar
 * las tarjetas sólo deja huecos raros y obliga a hacer más scroll. Ahí la rejilla
 * recta se lee mejor y el efecto premium lo aporta el cristal y el watermark.
 */
const PRENDA_TILES: Array<{
  label: string;
  type: string;
  Icon: IconComponent;
  offset: string;
}> = [
  { label: "Playera", type: "playera", Icon: Shirt, offset: "" },
  {
    label: "Sudadera",
    type: "sudadera",
    Icon: HoodieIcon,
    offset: "sm:translate-y-10",
  },
  { label: "Gorra", type: "gorra", Icon: CapIcon, offset: "" },
  {
    label: "Tote bag",
    type: "tote",
    Icon: ToteIcon,
    offset: "sm:translate-y-10",
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
          <div className="pointer-events-none absolute right-16 top-24 h-56 w-56 rounded-full bg-ml-green/10 blur-3xl" />

          <HeroAura items={HERO_AURA} />

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

            {/* Lo que hacemos, dicho con producto y no con abstracciones. Es la
                línea que responde "¿y esto qué es?" en el primer vistazo. */}
            <Reveal delay={0.12}>
              {/* Flex y no texto en línea: la palabra que rota reserva el ancho
                  de la más larga, y como caja en línea eso descolocaba su línea
                  base respecto a "Hacemos". Alineándolas como elementos flex se
                  centran por eje y el problema desaparece. */}
              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 text-2xl font-semibold leading-tight text-ml-white/90 sm:text-3xl">
                <span>Hacemos</span>
                <RotatingWord words={LAB_LINES.map((line) => line.word)} />
              </p>
              <p className="mt-5 text-lg font-medium text-ml-white/80 sm:text-xl">
                Desde una pieza hasta miles. Desde personas hasta empresas.
              </p>
              <p className="mt-2 text-ml-white/55">
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

            {/* Fila de líneas: los seis accesos reales, con su icono y su
                color. Sustituye a los chips genéricos — dice qué se produce en
                vez de categorías abstractas, y cada uno lleva a su familia. */}
            <Reveal delay={0.24} className="w-full">
              <div className="mt-12 flex flex-wrap items-center justify-center gap-2.5">
                {LAB_LINES.map((line) => (
                  <Link
                    key={line.href}
                    href={line.href}
                    className="glass group inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ml-white/75 transition hover:-translate-y-0.5 hover:border-ml-violet/50 hover:text-ml-white"
                  >
                    <line.Icon
                      className={`h-4 w-4 ${line.tone} transition group-hover:scale-110`}
                      aria-hidden
                    />
                    {line.label}
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
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ml-violet/15 blur-3xl" />

            {/* Logo de MatrixLab Wear como marca de agua del panel, igual que
                en las tarjetas de familia. Es el único activo real que existe
                para prendas: las carpetas de fotos de producto están vacías,
                así que el logo atenuado da presencia de marca sin inventar un
                mockup ni cargar una imagen pesada en la ruta crítica. */}
            <div
              className="pointer-events-none absolute -bottom-16 right-[-3rem] hidden h-72 w-72 opacity-[0.07] lg:block"
              aria-hidden
            >
              <Image
                src="/images/categories/matrixlab-wear.png"
                alt=""
                fill
                sizes="288px"
                className="object-contain"
              />
            </div>

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
                {/* Composición en diagonal: dos columnas escalonadas desde `sm`.
                    El padding inferior compensa el desfase de la segunda
                    columna para que no se coma el borde del panel. */}
                <div className="grid grid-cols-2 gap-4 sm:gap-5 sm:pb-10">
                  {PRENDA_TILES.map((item) => (
                    <TiltCard
                      key={item.type}
                      href={`/tienda/disenador/${item.type}`}
                      className={`h-36 transition-transform duration-500 sm:h-44 ${item.offset}`}
                    >
                      {/* Watermark: el mismo recurso que las tarjetas de familia
                          —icono sobredimensionado, muy translúcido, que crece un
                          poco en hover— para que la prenda se lea como dibujo de
                          fondo sin robarle contraste a la etiqueta. */}
                      <item.Icon
                        className="pointer-events-none absolute -bottom-6 -right-5 h-28 w-28 text-ml-violet opacity-[0.10] transition duration-500 group-hover:scale-110 group-hover:text-ml-cyan group-hover:opacity-[0.20] sm:h-32 sm:w-32"
                        aria-hidden
                      />
                      <item.Icon
                        className="relative h-8 w-8 text-ml-violet transition duration-300 group-hover:text-ml-cyan sm:h-9 sm:w-9"
                        aria-hidden
                      />
                      <span className="relative text-sm font-semibold sm:text-base">
                        {item.label}
                      </span>
                    </TiltCard>
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
              <div className="mx-auto max-w-3xl text-center">
                <span className="text-sm font-semibold uppercase tracking-widest text-ml-violet">
                  Tu proveedor creativo
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Diseñamos, producimos y{" "}
                  <span className="text-gradient">resolvemos volumen</span>
                </h2>
                <p className="mt-5 text-base text-ml-white/70 sm:text-lg">
                  Misma calidad y mismos acabados en la pieza 1 y en la 1,000.
                  Del primer boceto a la entrega, con tiempos claros y una sola
                  persona que te atiende.
                </p>
              </div>
            </Reveal>

            {/* Las cuatro capacidades, dichas como verbos. Responde "¿qué hacen
                por mí?" antes de que el visitante entre a elegir su caso. */}
            <Reveal delay={0.06}>
              <ul className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center justify-center gap-2.5">
                {CAPABILITIES.map((capability) => (
                  <li
                    key={capability.label}
                    className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ml-white/80"
                  >
                    <capability.Icon
                      className={`h-4 w-4 ${capability.tone}`}
                      aria-hidden
                    />
                    {capability.label}
                  </li>
                ))}
              </ul>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {AUDIENCE_CARDS.map((card, index) => (
                <Reveal
                  key={card.id}
                  delay={index * 0.08}
                  className="h-full"
                >
                  <div
                    className={`glass group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-8 transition duration-300 hover:-translate-y-1 sm:p-10 ${card.hoverBorder}`}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient}`}
                      aria-hidden
                    />
                    <div
                      className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full ${card.orb} blur-3xl`}
                      aria-hidden
                    />
                    {/* Watermark de la tarjeta: mismo recurso que las familias. */}
                    <card.Icon
                      className={`pointer-events-none absolute -bottom-10 -right-8 h-48 w-48 ${card.tone} opacity-[0.07] transition duration-500 group-hover:scale-105 group-hover:opacity-[0.14]`}
                      aria-hidden
                    />

                    <span
                      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${card.badgeBg} ${card.tone}`}
                    >
                      <card.Icon className="h-6 w-6" aria-hidden />
                    </span>

                    <h3 className="relative mt-5 text-2xl font-bold">
                      {card.title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-relaxed text-ml-white/70 sm:text-base">
                      {card.description}
                    </p>

                    {/* Casos concretos: es lo que hace que alguien se reconozca
                        en la tarjeta ("yo necesito kits") en vez de leer una
                        promesa abstracta. */}
                    <ul className="relative mt-6 flex flex-wrap gap-2">
                      {card.useCases.map((useCase) => (
                        <li
                          key={useCase}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium text-ml-white/75 ${card.chipBorder}`}
                        >
                          {useCase}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={buildWhatsAppUrl(card.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`relative mt-auto inline-flex w-fit items-center gap-2 pt-8 font-semibold transition hover:gap-3 ${card.tone}`}
                    >
                      <MessageCircle className="h-5 w-5" aria-hidden />
                      {card.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </Reveal>
              ))}
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

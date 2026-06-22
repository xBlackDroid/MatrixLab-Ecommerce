import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Gift,
  GraduationCap,
  Package,
  PartyPopper,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import CategoryGrid from "@/components/store/CategoryGrid";
import StoreCTA from "@/components/store/StoreCTA";
import StoreHero from "@/components/store/StoreHero";
import { getCategories } from "@/lib/store/products";

// Catálogo público con cache razonable (5 min). Carrito y checkout son
// siempre dinámicos en sus propias rutas.
export const revalidate = 300;

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

export default async function TiendaHomePage() {
  const categories = await getCategories();

  return (
    <>
      <StoreHero />

      {/* 1. Categorías principales */}
      <section id="catalogo" className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Categorías principales
              </h2>
              <p className="mt-2 text-ml-white/60">
                Todo sale del mismo laboratorio creativo.
              </p>
            </div>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* 2. Diseña en el laboratorio */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="glass relative mx-auto max-w-7xl overflow-hidden rounded-3xl p-10 sm:p-14">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-ml-cyan/10 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-ml-cyan">
                <Wand2 className="h-4 w-4" aria-hidden />
                T-Shirt Lab
              </span>
              <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
                Diseña tu prenda{" "}
                <span className="text-gradient">en el laboratorio</span>
              </h2>
              <p className="mt-4 max-w-lg text-ml-white/65">
                Sube tu imagen PNG, acomódala, ajusta tamaño y posición, elige
                producto base y envía tu diseño listo para producir.
              </p>
              <Link
                href="/tienda/disenador"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-ml-cyan px-7 py-3.5 font-semibold text-ml-bg shadow-glow-cyan transition hover:scale-[1.02] hover:bg-ml-cyan/90"
              >
                Abrir diseñador
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Playera", type: "playera" },
                { label: "Gorra", type: "gorra" },
                { label: "Tote bag", type: "tote" },
              ].map((item) => (
                <Link
                  key={item.type}
                  href={`/tienda/disenador/${item.type}`}
                  className="glass group flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl transition hover:border-ml-cyan/50"
                >
                  <Wand2
                    className="h-8 w-8 text-ml-violet transition group-hover:text-ml-cyan"
                    aria-hidden
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2.b Regreso a clases — Etiquetas Escolares Lab */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="glass relative mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-3xl p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-ml-violet/10 blur-3xl" />
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

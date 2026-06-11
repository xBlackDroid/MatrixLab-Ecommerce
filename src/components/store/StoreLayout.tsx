import Link from "next/link";
import { FlaskConical, MessageCircle, Sparkles } from "lucide-react";
import CartBadge from "@/components/store/CartBadge";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";

/**
 * Shell de la tienda: navegación superior + footer. La landing principal
 * NO usa este layout; vive únicamente bajo /tienda.
 */
export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ml-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/tienda" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ml-violet/15 text-ml-violet">
              <FlaskConical className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">
              MatrixLab{" "}
              <span className="text-gradient hidden sm:inline">Tienda</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-ml-white/75 md:flex">
            <Link href="/tienda" className="transition hover:text-ml-white">
              Tienda
            </Link>
            <Link
              href="/tienda/disenador"
              className="flex items-center gap-1.5 transition hover:text-ml-cyan"
            >
              <Sparkles className="h-4 w-4" aria-hidden />
              Diseñador
            </Link>
            <Link href="/" className="transition hover:text-ml-white">
              Inicio
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={buildWhatsAppUrl(whatsappMessages.customRequest())}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-ml-white/85 transition hover:border-ml-cyan/50 hover:text-ml-cyan sm:inline-flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
            <CartBadge />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-white/10 bg-ml-bg">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-6 py-10 text-center">
          <p className="text-lg font-semibold">
            MatrixLab <span className="text-gradient">Intelligence</span>
          </p>
          <p className="max-w-xl text-sm text-ml-white/60">
            Desde una pieza hasta miles. Desde personas hasta empresas. Un solo
            ecosistema creativo. Infinitas posibilidades.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-ml-white/60">
            <Link href="/tienda" className="hover:text-ml-violet">
              Catálogo
            </Link>
            <Link href="/tienda/disenador" className="hover:text-ml-cyan">
              Diseñador
            </Link>
            <Link href="/tienda/carrito" className="hover:text-ml-white">
              Carrito
            </Link>
            <a
              href={buildWhatsAppUrl(whatsappMessages.customRequest())}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-ml-coral"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

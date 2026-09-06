"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PhotoFrameArt, SparkleMark } from "@/components/icons/CourseDecor";
import type { CourseGalleryImage } from "@/lib/store/courses/gallery";

/**
 * Carrusel de fotos del taller.
 *
 * POR QUÉ SCROLL NATIVO Y NO UNA LIBRERÍA
 * ---------------------------------------
 * El carro es un contenedor con `overflow-x-auto` + `scroll-snap`. Con eso el
 * navegador aporta gratis —y mejor de lo que se puede reimplementar— el
 * arrastre táctil con inercia, el rebote de iOS, el scroll con trackpad, las
 * teclas de flecha cuando el contenedor tiene foco y el respeto por
 * `prefers-reduced-motion` en el scroll del usuario. No entra ni un kilobyte
 * de JavaScript de terceros y no hay listeners de `touchmove`.
 *
 * El JS que sí hay hace sólo dos cosas: saber qué foto está centrada (para los
 * puntos y para desactivar las flechas en los extremos) y mover el scroll
 * cuando se pulsa una flecha o un punto.
 *
 * SIN AUTOPLAY. Es una decisión, no un olvido: una galería que avanza sola
 * roba el control a quien está mirando una foto y es especialmente molesta en
 * móvil, que es donde va a verse esta página.
 *
 * MIENTRAS NO HAY FOTOS
 * ---------------------
 * `images` llega vacío y se pintan marcadores de posición de marca. En cuanto
 * se suban archivos a `public/images/tumbler/cursos/edicion-2/` con el nombre
 * de la convención (01.webp, 02.webp…), el servidor los descubre solo y este
 * mismo componente los muestra sin tocar una línea de código.
 */

/** Cuántos marcadores se pintan cuando todavía no hay fotos. */
const PLACEHOLDER_COUNT = 3;

/** Degradados de los marcadores: para que no se lean como tres cajas iguales. */
const PLACEHOLDER_STYLES = [
  { gradient: "from-ml-violet/20 via-ml-bg to-ml-cyan/15", tone: "text-ml-violet" },
  { gradient: "from-ml-cyan/20 via-ml-bg to-ml-coral/15", tone: "text-ml-cyan" },
  { gradient: "from-ml-coral/20 via-ml-bg to-ml-violet/15", tone: "text-ml-coral" },
] as const;

export default function CourseGallery({
  images,
  title,
}: {
  images: CourseGalleryImage[];
  title: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const hasPhotos = images.length > 0;
  const slideCount = hasPhotos ? images.length : PLACEHOLDER_COUNT;
  // Con una sola foto no hay a dónde navegar: sobran flechas y puntos.
  const showControls = hasPhotos && slideCount > 1;

  /**
   * Diapositiva activa: la que empieza más cerca del borde izquierdo visible.
   *
   * Se compara el INICIO de cada foto contra `scrollLeft`, no su centro contra
   * el centro del carro. Con `snap-start` y fotos más estrechas que el
   * contenedor, la primera nunca llega a estar centrada —está clavada en el
   * scroll 0—, así que el criterio de "la más centrada" marcaba la SEGUNDA
   * como activa nada más cargar, y la flecha de "anterior" aparecía habilitada
   * sin haber avanzado.
   *
   * Los extremos se resuelven aparte porque el scroll se topa: la última foto
   * tampoco puede llegar a alinearse al borde izquierdo.
   */
  const syncActive = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const count = track.children.length;
    if (count === 0) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    // Tolerancia de 2px: el scroll con snap deja restos subpíxel.
    if (maxScroll > 0 && track.scrollLeft >= maxScroll - 2) {
      setActive(count - 1);
      return;
    }

    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < count; i += 1) {
      const child = track.children[i] as HTMLElement;
      const start = child.offsetLeft - track.offsetLeft;
      const delta = Math.abs(start - track.scrollLeft);
      if (delta < distance) {
        distance = delta;
        closest = i;
      }
    }
    setActive(closest);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Un rAF por ráfaga de scroll: el handler no corre en cada píxel.
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncActive();
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    syncActive();
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [syncActive]);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const child = track.children[index] as HTMLElement | undefined;
    if (!child) return;
    // Se respeta la reducción de movimiento: con ella activa el salto es
    // instantáneo en vez de un desplazamiento animado.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: child.offsetLeft - track.offsetLeft,
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  return (
    <div>
      <div className="relative">
        <div
          ref={trackRef}
          // `tabIndex` para que el contenedor pueda recibir foco y responder a
          // las flechas del teclado, que es como lo recorre quien no usa ratón.
          tabIndex={0}
          role="group"
          aria-roledescription="carrusel"
          aria-label={`Fotos de ${title}`}
          // Sin `scroll-smooth` en CSS: la suavidad la decide el JS de las
          // flechas, que la apaga cuando hay reducción de movimiento. Con la
          // clase puesta, el teclado seguiría animando el scroll a quien pidió
          // que no.
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ml-violet/60 sm:gap-5"
        >
          {hasPhotos
            ? images.map((image) => (
                <figure
                  key={image.src}
                  className="relative aspect-[4/5] w-[84%] shrink-0 snap-start overflow-hidden rounded-[1.5rem] border border-ml-white/10 bg-ml-white/[0.03] sm:w-[58%] lg:w-[38%]"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 84vw, (max-width: 1024px) 58vw, 38vw"
                    className="object-cover"
                    // Sin `priority`: la galería vive MUY por debajo del
                    // pliegue. Marcar la primera foto como prioritaria
                    // inyectaría un <link rel=preload fetchpriority=high> que
                    // compite con el LCP real de la página (el hero) por el
                    // ancho de banda inicial, para una imagen que nadie ve
                    // hasta scrollear. La carga diferida de next/image ya la
                    // pide en cuanto se acerca.
                  />
                </figure>
              ))
            : Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
                <GalleryPlaceholder key={index} index={index} />
              ))}
        </div>

        {showControls && (
          <>
            <CarouselArrow
              direction="prev"
              disabled={active === 0}
              onClick={() => scrollToIndex(Math.max(0, active - 1))}
            />
            <CarouselArrow
              direction="next"
              disabled={active >= slideCount - 1}
              onClick={() =>
                scrollToIndex(Math.min(slideCount - 1, active + 1))
              }
            />
          </>
        )}
      </div>

      {showControls && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {images.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => scrollToIndex(index)}
              aria-label={`Ir a la foto ${index + 1} de ${slideCount}`}
              aria-current={index === active ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${
                index === active
                  ? "w-7 bg-ml-violet"
                  : "w-2 bg-ml-white/25 hover:bg-ml-white/45"
              }`}
            />
          ))}
        </div>
      )}

      {!hasPhotos && (
        <p className="mt-5 text-center text-sm text-ml-white/50">
          Estamos preparando las fotos del taller.
        </p>
      )}
    </div>
  );
}

/**
 * Flecha de navegación. Sólo en escritorio: en móvil la navegación es el
 * arrastre, y unas flechas encima de la foto sólo taparían la foto.
 */
function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "Ver foto anterior" : "Ver foto siguiente"}
      className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ml-white/15 bg-ml-bg/80 text-ml-white backdrop-blur-md transition hover:border-ml-violet/50 hover:text-ml-violet disabled:pointer-events-none disabled:opacity-0 md:flex ${
        isPrev ? "-left-3 lg:-left-5" : "-right-3 lg:-right-5"
      }`}
    >
      {isPrev ? (
        <ChevronLeft className="h-6 w-6" aria-hidden />
      ) : (
        <ChevronRight className="h-6 w-6" aria-hidden />
      )}
    </button>
  );
}

/**
 * Marcador de posición mientras la carpeta de fotos está vacía.
 *
 * Dice "aquí van fotos del taller" sin fingir que ya existen: ni fotos de
 * banco ni renders inventados. Es la misma promesa que el placeholder de
 * producto del catálogo, con el lenguaje visual de esta página.
 */
function GalleryPlaceholder({ index }: { index: number }) {
  const style = PLACEHOLDER_STYLES[index % PLACEHOLDER_STYLES.length];
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[4/5] w-[84%] shrink-0 snap-start items-center justify-center overflow-hidden rounded-[1.5rem] border border-ml-white/10 bg-gradient-to-br sm:w-[58%] lg:w-[38%] ${style.gradient}`}
    >
      <div
        className="grid-overlay pointer-events-none absolute inset-0 opacity-30"
        aria-hidden
      />
      <PhotoFrameArt className={`h-20 w-20 opacity-25 ${style.tone}`} />
      <SparkleMark
        className={`absolute right-6 top-6 h-5 w-5 opacity-30 ${style.tone}`}
      />
      <SparkleMark
        className={`absolute bottom-8 left-7 h-3 w-3 opacity-20 ${style.tone}`}
      />
    </div>
  );
}

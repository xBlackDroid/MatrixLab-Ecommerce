"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Galería independiente por producto: hasta tres fotos, con avance cada 5 s.
 *
 * Dos presentaciones, misma funcionalidad (clic, avance automático, pausa y
 * respeto a `prefers-reduced-motion`):
 *
 *   - `stacked` (por defecto): los controles ocupan su propia fila bajo la
 *     foto. Es el layout original del catálogo 3D y no cambia.
 *   - `overlay`: los controles flotan sobre la foto. Le da todo el alto de la
 *     tarjeta a la imagen, que es lo que necesita una vitrina de producto
 *     terminado.
 *
 * `aspectClass` permite ajustar la proporción al formato real de las fotos.
 * Con `object-contain` la foto NUNCA se recorta: se centra sobre el fondo de
 * la tarjeta, así que la proporción sólo decide cuánto espacio ocupa.
 */
export default function ProductPhotoGallery({
  images,
  title,
  placeholder,
  aspectClass = "aspect-square",
  variant = "stacked",
  sizes = "(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw",
}: {
  images: readonly string[];
  title: string;
  placeholder: string;
  aspectClass?: string;
  variant?: "stacked" | "overlay";
  sizes?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const available = [...new Set(images.filter(Boolean))]
    .slice(0, 3)
    .filter((src) => !failed.includes(src));
  const photos = available.length ? available : [placeholder];
  const index = active % photos.length;
  const multiple = photos.length > 1;
  const overlay = variant === "overlay";

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!multiple || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((current) => (current + 1) % photos.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [active, multiple, paused, reducedMotion, photos.length]);

  function move(offset: number) {
    setActive((index + offset + photos.length) % photos.length);
  }

  const control = cn(
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ml-bg/90 text-ml-white transition hover:border-ml-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-cyan",
    overlay && "h-10 w-10 text-sm backdrop-blur-sm",
  );

  const controls = multiple ? (
    <>
      {photos.map((src, photoIndex) => (
        <button
          key={src}
          type="button"
          onClick={() => setActive(photoIndex)}
          aria-label={`Ver foto ${photoIndex + 1} de ${title}`}
          aria-pressed={photoIndex === index}
          className={cn(control, photoIndex === index && "border-ml-cyan bg-ml-cyan/15 text-ml-cyan")}
        >
          {photoIndex + 1}
        </button>
      ))}
      {!reducedMotion && (
        <button
          type="button"
          className={control}
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Reanudar cambio automático" : "Pausar cambio automático"}
        >
          {paused ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
        </button>
      )}
    </>
  ) : null;

  return (
    <div role="group" aria-roledescription="galería" aria-label={`Fotos de ${title}`}>
      <div
        className={cn(
          "relative w-full overflow-hidden",
          aspectClass,
          overlay
            ? "bg-linear-to-b from-white/10 via-ml-bg/30 to-ml-bg/70"
            : "bg-ml-bg/40",
        )}
      >
        <Image
          src={photos[index]}
          alt={`${title} — foto ${index + 1} de ${photos.length}`}
          fill
          sizes={sizes}
          className="object-contain"
          onError={() => {
            const src = photos[index];
            if (src !== placeholder) {
              setFailed((previous) => [...new Set([...previous, src])]);
            }
          }}
        />
        {multiple && (
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={`Ver siguiente foto de ${title}`}
            className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ml-cyan"
          />
        )}
        {overlay && controls && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-ml-bg/70 p-1 backdrop-blur-sm">
              {controls}
            </div>
          </div>
        )}
      </div>
      {!overlay && (
        <div className="flex min-h-[60px] items-center justify-center gap-1.5 px-2 py-2">
          {controls ?? (
            <span className="text-xs text-ml-white/50">
              {photos[0] === placeholder ? "Fotografía próximamente" : "1 foto"}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

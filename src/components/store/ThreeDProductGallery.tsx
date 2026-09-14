"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { MATRIXLAB_3D_PLACEHOLDER_IMAGE } from "@/lib/store/matrixlab-3d";
import { cn } from "@/lib/utils";

/** Galería independiente por pieza: hasta tres fotos, con avance cada 5 s. */
export default function ThreeDProductGallery({
  images,
  title,
}: {
  images: readonly string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const available = [...new Set(images.filter(Boolean))]
    .slice(0, 3)
    .filter((src) => !failed.includes(src));
  const photos = available.length ? available : [MATRIXLAB_3D_PLACEHOLDER_IMAGE];
  const index = active % photos.length;
  const multiple = photos.length > 1;

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

  const control = "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ml-bg/90 text-ml-white transition hover:border-ml-cyan focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ml-cyan";

  return (
    <div role="group" aria-roledescription="galería" aria-label={`Fotos de ${title}`}>
      <div className="relative aspect-square w-full overflow-hidden bg-ml-bg/40">
        <Image
          src={photos[index]}
          alt={`${title} — foto ${index + 1} de ${photos.length}`}
          fill
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          className="object-contain"
          onError={() => {
            const src = photos[index];
            if (src !== MATRIXLAB_3D_PLACEHOLDER_IMAGE) {
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
      </div>
      <div className="flex min-h-[60px] items-center justify-center gap-1.5 px-2 py-2">
        {multiple ? <>
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
        </> : <span className="text-xs text-ml-white/50">{photos[0] === MATRIXLAB_3D_PLACEHOLDER_IMAGE ? "Fotografía próximamente" : "1 foto"}</span>}
      </div>
    </div>
  );
}

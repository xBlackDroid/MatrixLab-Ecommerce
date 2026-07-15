"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { RotateCcw, RotateCw } from "lucide-react";
import type { DesignerProductType } from "@/lib/db/types";
import type { ViewType } from "@/lib/designer/product-views";
import { cn } from "@/lib/utils";

/**
 * Visor de giro de producto (Etapa 2), estilo visor de autos.
 *
 * - Si hay frames (secuencia por color), el arrastre recorre los frames (360).
 * - Si no hay frames, usa fallback frente/espalda con transición pseudo-3D
 *   (rotateY), arrastrando horizontalmente o con los botones.
 *
 * No usa Three.js ni CDNs. Las imágenes son previews compuestas (data URLs)
 * generadas localmente en el editor, así que no contaminan nada externo.
 */

interface ProductSpinViewerProps {
  productType: DesignerProductType;
  colorId?: string;
  views: { frames?: string[]; front?: string | null; back?: string | null };
  viewType?: ViewType;
  angle?: number;
  onAngleChange?: (a: number) => void;
  side?: "front" | "back";
  onSideChange?: (s: "front" | "back") => void;
}

function normalize(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export default function ProductSpinViewer({
  views,
  viewType = "fallback",
  angle: angleProp,
  onAngleChange,
  side: sideProp,
  onSideChange,
}: ProductSpinViewerProps) {
  const frames = views.frames ?? [];
  const hasFrames = frames.length > 1;
  const [internalAngle, setInternalAngle] = useState(0);
  const angle = angleProp ?? internalAngle;
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const setAngle = (next: number) => {
    const value = viewType === "180" ? Math.max(0, Math.min(180, next)) : next;
    onAngleChange?.(value);
    if (angleProp === undefined) setInternalAngle(value);
  };

  const norm = normalize(angle);
  // Lado derivado del ángulo cuando no es controlado.
  const derivedSide: "front" | "back" =
    norm > 90 && norm < 270 ? "back" : "front";
  const side = sideProp ?? derivedSide;

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startDrag(clientX: number) {
    dragRef.current = { startX: clientX, startAngle: angle };
  }
  function moveDrag(clientX: number) {
    if (!dragRef.current) return;
    const delta = (clientX - dragRef.current.startX) * 0.8;
    setAngle(dragRef.current.startAngle + delta);
  }
  function endDrag() {
    dragRef.current = null;
  }

  function spinOnce() {
    const start = performance.now();
    const from = angle;
    const duration = 1200;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAngle(from + 360 * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }

  function setSide(s: "front" | "back") {
    onSideChange?.(s);
    setAngle(s === "back" ? 180 : 0);
  }

  const frameSrc = hasFrames
    ? frames[Math.floor((norm / 360) * frames.length) % frames.length]
    : null;
  // Sin vista posterior (p. ej. gorras) el giro recae en el frente: nunca se
  // muestra una pantalla vacía a mitad del giro.
  const fallbackSrc =
    side === "back" ? (views.back ?? views.front) : views.front;
  const showImage = frameSrc ?? fallbackSrc ?? null;
  const flipBack = !hasFrames && side === "back" && Boolean(views.back);

  return (
    <div data-testid="spin-viewer" className="flex flex-col items-center gap-3">
      <div
        role="img"
        aria-label="Vista del producto"
        className="relative aspect-[4/5] w-full max-w-sm cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-white/10 bg-ml-bg active:cursor-grabbing"
        style={{ perspective: "1200px" }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          startDrag(e.clientX);
        }}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {showImage ? (
          <div
            className="absolute inset-0 transition-transform duration-100"
            style={{
              transform: hasFrames
                ? undefined
                : `rotateY(${flipBack ? norm - 180 : norm}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* La preview de espalda ya está capturada tal como se ve la
                prenda girada: se muestra SIN espejear (un scaleX(-1) aquí
                invertía el diseño y cualquier texto se leía al revés). */}
            <Image
              src={showImage}
              alt="Producto"
              fill
              unoptimized
              sizes="384px"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ml-white/45">
            Abre la vista de giro desde el diseñador para ver tu prenda por
            ambos lados.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSide("front")}
          className={cn(
            "min-h-11 rounded-full border px-4 py-1.5 text-sm transition",
            side === "front"
              ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
              : "border-white/15 text-ml-white/70 hover:border-white/30",
          )}
        >
          Frente
        </button>
        {/* El botón de espalda solo aparece cuando de verdad hay vista
            posterior (frames o preview de espalda). Las gorras, que solo se
            diseñan de frente, no muestran un botón roto. */}
        {(hasFrames || views.back) && (
          <button
            type="button"
            onClick={() => setSide("back")}
            className={cn(
              "min-h-11 rounded-full border px-4 py-1.5 text-sm transition",
              side === "back"
                ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                : "border-white/15 text-ml-white/70 hover:border-white/30",
            )}
          >
            Espalda
          </button>
        )}
        <button
          type="button"
          onClick={spinOnce}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-sm text-ml-white/70 transition hover:border-ml-violet/50 hover:text-ml-violet"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          Girar
        </button>
        <button
          type="button"
          onClick={() => setAngle(0)}
          aria-label="Reiniciar vista"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/15 px-4 py-1.5 text-sm text-ml-white/70 transition hover:border-white/30"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reiniciar
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import {
  getTypographyTemplate,
  type TemplateDecoration,
  type TemplateTextStyle,
  type TypographyTemplate,
} from "@/lib/designer/school-labels/templates";
import { cn } from "@/lib/utils";

/** Posición (px, relativa al centro) y escala de la imagen dentro de la etiqueta. */
export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

export const DEFAULT_IMAGE_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1 };

/** Límites para que la imagen no se pierda fuera del área de la etiqueta. */
const DRAG_LIMIT = 180;
export const IMAGE_SCALE_MIN = 0.3;
export const IMAGE_SCALE_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Renderiza una etiqueta escolar REAL a partir de la plantilla de la tipografia
 * elegida: nombre real + apellidos reales con el estilo (familia, color por
 * letra, contorno, sombra), el layout y las decoraciones de la plantilla.
 *
 * Esta es la PREVIEW PRINCIPAL: no usa la imagen de muestra del PDF como
 * etiqueta final (esa solo es referencia secundaria en SchoolLabelPreview).
 */

export interface SchoolLabelTemplateProps {
  firstName: string;
  lastNames: string;
  typographyCode: string;
  imageUrl?: string | null;
  /** Posición/escala de la imagen (editable). Si falta, se usa el default. */
  imageTransform?: ImageTransform;
  /** Si se provee, la imagen es arrastrable dentro de la etiqueta (hero). */
  onImageTransformChange?: (next: ImageTransform) => void;
  /** "hero" = etiqueta principal grande; "mini" = mini etiqueta compacta. */
  variant?: "hero" | "mini";
  className?: string;
}

export default function SchoolLabelTemplate({
  firstName,
  lastNames,
  typographyCode,
  imageUrl,
  imageTransform,
  onImageTransformChange,
  variant = "hero",
  className,
}: SchoolLabelTemplateProps) {
  const template = getTypographyTemplate(typographyCode);
  const name = firstName.trim() || "Tu nombre";
  const last = lastNames.trim();
  const scale = variant === "mini" ? 0.42 : 1;
  const transform = imageTransform ?? DEFAULT_IMAGE_TRANSFORM;

  // La imagen es arrastrable solo en el hero, con imagen y handler de cambio.
  const draggable = Boolean(
    variant === "hero" && imageUrl && onImageTransformChange,
  );
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: transform.x,
      origY: transform.y,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!draggable || !dragRef.current || !onImageTransformChange) return;
    const d = dragRef.current;
    onImageTransformChange({
      ...transform,
      x: clamp(d.origX + (e.clientX - d.startX), -DRAG_LIMIT, DRAG_LIMIT),
      y: clamp(d.origY + (e.clientY - d.startY), -DRAG_LIMIT, DRAG_LIMIT),
    });
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current = null;
  }

  return (
    <div
      className={cn(
        "relative flex w-full items-center justify-center overflow-hidden rounded-2xl",
        variant === "hero" ? "min-h-[150px] px-5 py-6" : "min-h-[70px] px-2 py-2.5",
        draggable && "cursor-move select-none",
        className,
      )}
      style={{
        background: template.surface ?? "#ffffff",
        ...(draggable ? { touchAction: "none" } : {}),
      }}
      onPointerDown={draggable ? handlePointerDown : undefined}
      onPointerMove={draggable ? handlePointerMove : undefined}
      onPointerUp={draggable ? endDrag : undefined}
      onPointerCancel={draggable ? endDrag : undefined}
    >
      {variant === "hero" && (
        <BackgroundDecorations decorations={template.decorations} scale={scale} />
      )}

      {/* Imagen subida: SIEMPRE detrás del texto (z-0), centrada y movible. */}
      {imageUrl && variant === "hero" && (
        <div
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="h-28 w-auto max-w-[85%] rounded-xl object-contain opacity-90"
            style={{
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            }}
          />
        </div>
      )}

      {variant === "mini" ? (
        // Mini etiqueta: solo el nombre centrado en su estilo (sin iconos, para
        // que no se recorte en el tile pequeno).
        <StyledText text={name} style={template.nameStyle} scale={scale} />
      ) : (
        // El texto va SIEMPRE encima de la imagen (z-[1]); cuando se arrastra,
        // los pointer-events pasan al contenedor para mover la imagen.
        <div
          className={cn(
            "relative z-[1] flex w-full items-center justify-center",
            draggable && "pointer-events-none",
          )}
        >
          <LayoutBody template={template} name={name} last={last} scale={scale} />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function LayoutBody({
  template,
  name,
  last,
  scale,
}: {
  template: TypographyTemplate;
  name: string;
  last: string;
  scale: number;
}) {
  const side = pickDecoration(template.decorations, ["left", "right"]);
  const top = pickDecoration(template.decorations, ["top"]);

  const nameBlock = (
    <div className="flex max-w-full flex-col items-center">
      {top && <DecorationRow decoration={top} scale={scale} />}
      <StyledText text={name} style={template.nameStyle} scale={scale} />
      {last && (
        <StyledText
          text={last}
          style={template.lastNameStyle}
          scale={scale}
          className="mt-1"
        />
      )}
    </div>
  );

  // scriptName: nombre (+ apellidos) en diagonal. La decoracion va de fondo
  // (BackgroundDecorations), no inline.
  if (template.layout === "scriptName") {
    return (
      <div
        className="relative z-[1] flex flex-col items-center"
        style={
          template.nameRotateDeg
            ? { transform: `rotate(${template.nameRotateDeg}deg)` }
            : undefined
        }
      >
        {nameBlock}
      </div>
    );
  }

  // Cualquier layout con decoracion lateral (izq/der): icono + bloque de texto.
  // iconLeft/character usan icono grande; twoLine/badge un icono mediano.
  if (side) {
    const big =
      template.layout === "iconLeft" || template.layout === "character";
    const onRight = side.position === "right";
    const sizePx =
      (big ? (template.layout === "character" ? 76 : 60) : 40) * scale;
    return (
      <div
        className={cn(
          "relative z-[1] flex w-full items-center justify-center gap-3",
          onRight && "flex-row-reverse",
        )}
      >
        <Decoration decoration={side} sizePx={sizePx} />
        {nameBlock}
      </div>
    );
  }

  // badge / twoLine / arched sin icono lateral: bloque centrado.
  return <div className="relative z-[1] flex flex-col items-center">{nameBlock}</div>;
}

// ---------------------------------------------------------------------------
// Texto estilizado (color solido / por letra / degradado)
// ---------------------------------------------------------------------------

function StyledText({
  text,
  style,
  scale,
  className,
}: {
  text: string;
  style: TemplateTextStyle;
  scale: number;
  className?: string;
}) {
  const transformed = applyTransform(text, style.textTransform);
  const words = transformed.split(/\s+/).filter(Boolean);

  // Auto-ajuste por largo de palabra: una palabra larga (CASTANEDA) reduce el
  // tamano para no desbordar. Las palabras NUNCA se parten a la mitad; los
  // nombres de 2 palabras envuelven entre palabras (2 lineas).
  const longest = words.reduce((m, w) => Math.max(m, w.length), 0);
  const fit = longest > 6 ? Math.max(0.5, 6 / longest) : 1;
  const fontSize = Math.round(style.fontSize * scale * fit);

  const base: CSSProperties = {
    fontFamily: style.fontFamily,
    fontSize: `${fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    letterSpacing: style.letterSpacing,
    lineHeight: 1.04,
    maxWidth: "100%",
    columnGap: "0.22em",
    rowGap: 0,
  };
  if (style.shadow) base.textShadow = style.shadow;
  if (style.stroke) {
    const [w, c] = splitStroke(style.stroke);
    (base as Record<string, string>).WebkitTextStroke = `${w} ${c}`;
    base.paintOrder = "stroke fill";
  }

  const mode = style.colorMode ?? "solid";
  const palette = style.palette;
  let colorIndex = 0;

  function renderWord(word: string, wi: number) {
    // Color por letra (continuo a lo largo del nombre).
    if (
      (mode === "rainbowLetters" || mode === "pastelLetters") &&
      palette?.length
    ) {
      return (
        <span key={`${word}-${wi}`} className="whitespace-nowrap">
          {Array.from(word).map((ch, ci) => {
            const color = palette[colorIndex % palette.length]!;
            colorIndex += 1;
            return (
              <span key={ci} style={{ color }}>
                {ch}
              </span>
            );
          })}
        </span>
      );
    }
    // Degradado recortado al texto.
    if (mode === "gradient" && style.gradient) {
      return (
        <span
          key={`${word}-${wi}`}
          className="whitespace-nowrap"
          style={{
            backgroundImage: style.gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {word}
        </span>
      );
    }
    // Color solido.
    return (
      <span
        key={`${word}-${wi}`}
        className="whitespace-nowrap"
        style={{ color: style.color ?? "#1f2937" }}
      >
        {word}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex flex-wrap items-baseline justify-center text-center",
        className,
      )}
      style={base}
    >
      {words.map(renderWord)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Decoraciones
// ---------------------------------------------------------------------------

function Decoration({
  decoration,
  sizePx,
}: {
  decoration: TemplateDecoration;
  sizePx: number;
}) {
  if (decoration.type === "asset") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={decoration.value}
        alt=""
        aria-hidden
        style={{ width: sizePx, height: sizePx }}
        className="shrink-0 object-contain"
      />
    );
  }
  // emoji / shape (shape se trata como glifo/emoji)
  return (
    <span
      aria-hidden
      className="shrink-0 leading-none"
      style={{ fontSize: `${Math.round(sizePx)}px` }}
    >
      {decoration.value}
    </span>
  );
}

function DecorationRow({
  decoration,
  scale,
}: {
  decoration: TemplateDecoration;
  scale: number;
}) {
  // Para estrellas (badge): muestra una fila de 3.
  const triple = decoration.value === "⭐";
  return (
    <span
      aria-hidden
      className="mb-0.5 leading-none tracking-widest"
      style={{ fontSize: `${Math.round(16 * scale)}px` }}
    >
      {triple
        ? `${decoration.value}${decoration.value}${decoration.value}`
        : decoration.value}
    </span>
  );
}

function BackgroundDecorations({
  decorations,
  scale,
}: {
  decorations?: TemplateDecoration[];
  scale: number;
}) {
  const bg = decorations?.filter((d) => d.position === "background") ?? [];
  if (!bg.length) return null;
  return (
    <>
      {bg.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute -bottom-2 left-1 select-none opacity-15"
          style={{ fontSize: `${Math.round(120 * scale)}px` }}
        >
          {d.value}
        </span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pickDecoration(
  decorations: TemplateDecoration[] | undefined,
  positions: TemplateDecoration["position"][],
): TemplateDecoration | null {
  return decorations?.find((d) => positions.includes(d.position)) ?? null;
}

function applyTransform(
  text: string,
  transform: TemplateTextStyle["textTransform"],
): string {
  if (transform === "uppercase") return text.toLocaleUpperCase("es");
  if (transform === "capitalize") {
    return text
      .toLocaleLowerCase("es")
      .replace(/(^|\s)\p{L}/gu, (m) => m.toLocaleUpperCase("es"));
  }
  return text;
}

/** Divide "1.5px #fff" en ["1.5px", "#fff"]. */
function splitStroke(stroke: string): [string, string] {
  const idx = stroke.indexOf(" ");
  if (idx === -1) return ["1px", stroke];
  return [stroke.slice(0, idx), stroke.slice(idx + 1)];
}

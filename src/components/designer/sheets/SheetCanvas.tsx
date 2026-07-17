"use client";

import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
} from "react-konva";
import type Konva from "konva";
import {
  canPlace,
  clampToPrintable,
  type PrintableAreaCm,
  type RectCm,
} from "@/components/designer/sheets/CollisionEngine";
import type { SheetPiece } from "@/lib/designer/types";

/** px lógicos por cm en el lienzo de planilla. */
export const SHEET_PX_PER_CM = 26;

interface SheetCanvasProps {
  mode: "free" | "repeat";
  pageCm: { width: number; height: number };
  printableCm: PrintableAreaCm;
  spacingCm: number;
  pieces?: SheetPiece[];
  images?: Record<string, HTMLImageElement>;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onMove?: (id: string, xCm: number, yCm: number) => void;
  onCollision?: () => void;
  repeatImage?: HTMLImageElement | null;
  repeatShape?: "square" | "circle" | "rectangle";
  repeatSizeCm?: { width: number; height: number };
  repeatPlacements?: Array<{ xCm: number; yCm: number }>;
  onStageReady?: (stage: Konva.Stage | null) => void;
}

const toRect = (p: SheetPiece): RectCm => ({
  xCm: p.xCm,
  yCm: p.yCm,
  widthCm: p.widthCm,
  heightCm: p.heightCm,
});

export default function SheetCanvas({
  mode,
  pageCm,
  printableCm,
  spacingCm,
  pieces = [],
  images = {},
  selectedId,
  onSelect,
  onMove,
  onCollision,
  repeatImage,
  repeatShape = "square",
  repeatSizeCm,
  repeatPlacements = [],
  onStageReady,
}: SheetCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const px = SHEET_PX_PER_CM;
  const stageW = pageCm.width * px;
  const stageH = pageCm.height * px;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? stageW;
      setDisplayScale(Math.min(1, width / stageW));
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [stageW]);

  return (
    <div ref={containerRef} className="w-full">
      <Stage
        ref={(node) => onStageReady?.(node)}
        width={stageW * displayScale}
        height={stageH * displayScale}
        scaleX={displayScale}
        scaleY={displayScale}
        className="mx-auto"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect?.(null);
        }}
      >
        <Layer listening={false}>
          {/* Hoja carta */}
          <Rect x={0} y={0} width={stageW} height={stageH} fill="#0B0F19" />
          <Rect
            x={4}
            y={4}
            width={stageW - 8}
            height={stageH - 8}
            cornerRadius={6}
            fill="#F8F9FA"
            shadowColor="#000000"
            shadowBlur={20}
            shadowOpacity={0.4}
          />
          {/* Margen no imprimible (overlay) */}
          <Rect
            x={printableCm.xCm * px}
            y={printableCm.yCm * px}
            width={printableCm.widthCm * px}
            height={printableCm.heightCm * px}
            stroke="#4DCEFF"
            strokeWidth={1.5}
            dash={[8, 6]}
          />
          <Text
            x={printableCm.xCm * px}
            y={printableCm.yCm * px - 18}
            text="Área imprimible (hoja carta)"
            fontSize={12}
            fontStyle="bold"
            fill="#4DCEFF"
          />
        </Layer>

        {mode === "repeat" && repeatImage && repeatSizeCm && (
          <Layer listening={false}>
            {repeatPlacements.map((pl, i) => {
              const w = repeatSizeCm.width * px;
              const h = repeatSizeCm.height * px;
              const x = pl.xCm * px;
              const y = pl.yCm * px;
              // La imagen llena la pieza en modo "cover" (centrada, recorte
              // uniforme) y la forma (círculo / cuadrado / rectángulo) actúa
              // como máscara real vía clipFunc. Nota: NO usamos fillPattern
              // porque su transform (offset/scale) desplazaba la imagen fuera
              // del círculo y las piezas se veían vacías.
              const cover = Math.max(w / repeatImage.width, h / repeatImage.height);
              const drawW = repeatImage.width * cover;
              const drawH = repeatImage.height * cover;
              const drawX = x + (w - drawW) / 2;
              const drawY = y + (h - drawH) / 2;
              const radius = Math.min(w, h) / 2;
              const cornerRadius = repeatShape === "square" ? 6 : 4;
              return (
                <Group
                  key={i}
                  clipFunc={(ctx) => {
                    if (repeatShape === "circle") {
                      ctx.arc(x + w / 2, y + h / 2, radius, 0, Math.PI * 2, false);
                    } else {
                      // Rectángulo con esquinas redondeadas (cuadrado/rect).
                      const r = Math.min(cornerRadius, w / 2, h / 2);
                      ctx.moveTo(x + r, y);
                      ctx.arcTo(x + w, y, x + w, y + h, r);
                      ctx.arcTo(x + w, y + h, x, y + h, r);
                      ctx.arcTo(x, y + h, x, y, r);
                      ctx.arcTo(x, y, x + w, y, r);
                    }
                  }}
                >
                  <KonvaImage
                    image={repeatImage}
                    x={drawX}
                    y={drawY}
                    width={drawW}
                    height={drawH}
                  />
                </Group>
              );
            })}
            {/* Línea de corte de referencia sobre cada pieza. */}
            {repeatPlacements.map((pl, i) => {
              const w = repeatSizeCm.width * px;
              const h = repeatSizeCm.height * px;
              const x = pl.xCm * px;
              const y = pl.yCm * px;
              if (repeatShape === "circle") {
                return (
                  <Circle
                    key={`cut-${i}`}
                    x={x + w / 2}
                    y={y + h / 2}
                    radius={Math.min(w, h) / 2}
                    stroke="#94A3B8"
                    strokeWidth={1}
                    dash={[4, 4]}
                    opacity={0.7}
                  />
                );
              }
              return (
                <Rect
                  key={`cut-${i}`}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  cornerRadius={repeatShape === "square" ? 6 : 4}
                  stroke="#94A3B8"
                  strokeWidth={1}
                  dash={[4, 4]}
                  opacity={0.7}
                />
              );
            })}
          </Layer>
        )}

        {mode === "free" && (
          <Layer>
            {pieces.map((piece) => {
              const img = images[piece.id];
              if (!img) return null;
              const w = piece.widthCm * px;
              const h = piece.heightCm * px;
              const selected = piece.id === selectedId;
              return (
                <Group key={piece.id}>
                  <KonvaImage
                    image={img}
                    x={piece.xCm * px}
                    y={piece.yCm * px}
                    width={w}
                    height={h}
                    draggable
                    onMouseDown={() => onSelect?.(piece.id)}
                    onTouchStart={() => onSelect?.(piece.id)}
                    onDragEnd={(e) => {
                      const node = e.target;
                      const candidate: RectCm = {
                        xCm: node.x() / px,
                        yCm: node.y() / px,
                        widthCm: piece.widthCm,
                        heightCm: piece.heightCm,
                      };
                      const clamped = clampToPrintable(candidate, printableCm);
                      const others = pieces
                        .filter((p) => p.id !== piece.id)
                        .map(toRect);
                      if (canPlace(clamped, others, printableCm, spacingCm)) {
                        node.position({ x: clamped.xCm * px, y: clamped.yCm * px });
                        onMove?.(piece.id, clamped.xCm, clamped.yCm);
                      } else {
                        node.position({ x: piece.xCm * px, y: piece.yCm * px });
                        onCollision?.();
                      }
                    }}
                  />
                  {selected && (
                    <Rect
                      x={piece.xCm * px}
                      y={piece.yCm * px}
                      width={w}
                      height={h}
                      stroke="#B197FC"
                      strokeWidth={2}
                      dash={[5, 4]}
                      listening={false}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>
        )}
      </Stage>
    </div>
  );
}

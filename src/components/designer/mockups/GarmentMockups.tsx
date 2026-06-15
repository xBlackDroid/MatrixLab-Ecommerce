"use client";

import { Circle, Ellipse, Group, Line, Path, Rect } from "react-konva";
import type { MockupKey } from "@/lib/designer/product-views";

/**
 * Mockups vectoriales del Laboratorio (Etapa 2) — siluetas realistas.
 *
 * Premium, simétricas (coordenadas espejeadas) con gradiente y sombras suaves.
 * No dependen de imágenes externas.
 *
 * CÓMO USAR MOCKUPS REALES: cuando existan PNG por color, declara
 *   `mockupByColor` en src/lib/designer/product-views.ts y el lienzo usará la
 *   imagen en vez de este vector. Rutas sugeridas:
 *     public/images/products/playeras/mockups/<color>-front.png
 *     public/images/products/sudaderas/mockups/<color>-front.png
 *     public/images/products/gorras/trucker/mockups/<color>.png
 *     public/images/products/gorras/clasica/mockups/<color>.png
 *   Este fallback vectorial se conserva para colores sin foto.
 */

export interface MockupColor {
  hex: string;
  shadowHex: string;
}

interface MockupProps {
  mockupKey: MockupKey;
  side: "front" | "back";
  color: MockupColor;
}

function grad(
  color: MockupColor,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  return {
    fillLinearGradientStartPoint: from,
    fillLinearGradientEndPoint: to,
    fillLinearGradientColorStops: [0, color.hex, 1, color.shadowHex] as (
      | string
      | number
    )[],
  };
}

const SOFT_SHADOW = {
  shadowColor: "#000000",
  shadowBlur: 26,
  shadowOpacity: 0.45,
  shadowOffsetY: 14,
} as const;

/* ----------------------------- Playera ----------------------------------- */
function Playera({ side, color }: { side: "front" | "back"; color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Mangas (debajo del cuerpo) */}
      <Path data="M170 158 C140 162 112 184 98 214 C112 226 132 234 150 236 C156 214 160 186 172 166 Z" {...grad(color, { x: 100, y: 160 }, { x: 170, y: 236 })} />
      <Path data="M350 158 C380 162 408 184 422 214 C408 226 388 234 370 236 C364 214 360 186 348 166 Z" {...grad(color, { x: 420, y: 160 }, { x: 350, y: 236 })} />
      {/* Cuerpo */}
      <Path
        data="M150 210 C150 180 172 160 210 156 L310 156 C348 160 370 180 370 210 L376 532 Q378 544 366 544 L154 544 Q142 544 144 532 Z"
        {...grad(color, { x: 150, y: 160 }, { x: 380, y: 545 })}
        {...SOFT_SHADOW}
      />
      {/* Volumen lateral */}
      <Path data="M150 216 L156 540 L170 540 C161 430 159 320 163 222 Z" fill="#000000" opacity={0.07} />
      <Path data="M370 216 L364 540 L350 540 C359 430 361 320 357 222 Z" fill="#000000" opacity={0.07} />
      {/* Costuras de manga */}
      <Path data="M172 166 C160 186 156 214 150 236" stroke={color.shadowHex} strokeWidth={2} opacity={0.5} />
      <Path data="M348 166 C360 186 364 214 370 236" stroke={color.shadowHex} strokeWidth={2} opacity={0.5} />
      {/* Cuello redondo */}
      {side === "front" ? (
        <>
          <Path data="M206 156 C224 182 296 182 314 156 C300 170 220 170 206 156 Z" fill={color.shadowHex} />
          <Path data="M204 155 C224 184 296 184 316 155" stroke={color.shadowHex} strokeWidth={6} lineCap="round" />
        </>
      ) : (
        <>
          <Path data="M210 156 C228 168 292 168 310 156 C296 164 224 164 210 156 Z" fill={color.shadowHex} opacity={0.75} />
          <Path data="M208 156 C228 170 292 170 312 156" stroke={color.shadowHex} strokeWidth={5} lineCap="round" />
        </>
      )}
    </Group>
  );
}

/* ----------------------------- Sudadera ---------------------------------- */
function Sudadera({ side, color }: { side: "front" | "back"; color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Mangas largas */}
      <Path data="M176 182 C146 196 128 240 126 300 L130 470 C130 500 150 516 178 510 C172 460 172 320 180 200 Z" {...grad(color, { x: 120, y: 200 }, { x: 180, y: 510 })} />
      <Path data="M364 182 C394 196 412 240 414 300 L410 470 C410 500 390 516 362 510 C368 460 368 320 360 200 Z" {...grad(color, { x: 420, y: 200 }, { x: 360, y: 510 })} />
      {/* Puños */}
      <Rect x={126} y={494} width={54} height={22} cornerRadius={5} fill="#000000" opacity={0.14} />
      <Rect x={360} y={494} width={54} height={22} cornerRadius={5} fill="#000000" opacity={0.14} />
      {/* Cuerpo */}
      <Path
        data="M156 230 C156 198 180 176 220 172 L320 172 C360 176 384 198 384 230 L392 560 Q394 574 380 574 L160 574 Q146 574 148 560 Z"
        {...grad(color, { x: 150, y: 180 }, { x: 390, y: 575 })}
        {...SOFT_SHADOW}
      />
      {/* Ribete inferior */}
      <Rect x={156} y={556} width={228} height={18} cornerRadius={4} fill="#000000" opacity={0.13} />
      {side === "front" ? (
        <>
          {/* Bolsillo canguro */}
          <Path data="M198 430 L342 430 L330 502 L210 502 Z" fill="#000000" opacity={0.1} />
          <Line points={[198, 430, 342, 430]} stroke={color.shadowHex} strokeWidth={2} opacity={0.55} />
          <Line points={[210, 502, 222, 462]} stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
          <Line points={[330, 502, 318, 462]} stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
          {/* Capucha */}
          <Path data="M214 176 C214 138 326 138 326 176 C326 198 300 208 270 208 C240 208 214 198 214 176 Z" {...grad(color, { x: 214, y: 138 }, { x: 326, y: 208 })} />
          <Path data="M232 178 C232 156 308 156 308 178 C308 194 290 202 270 202 C250 202 232 194 232 178 Z" fill={color.shadowHex} />
          {/* Cordones */}
          <Line points={[259, 202, 257, 250]} stroke={color.shadowHex} strokeWidth={4} lineCap="round" />
          <Line points={[283, 202, 285, 250]} stroke={color.shadowHex} strokeWidth={4} lineCap="round" />
          <Circle x={257} y={252} radius={4} fill={color.shadowHex} />
          <Circle x={285} y={252} radius={4} fill={color.shadowHex} />
        </>
      ) : (
        <Path data="M218 172 C220 140 320 140 322 172 C300 186 240 186 218 172 Z" {...grad(color, { x: 218, y: 140 }, { x: 322, y: 186 })} />
      )}
    </Group>
  );
}

/* --------------------------- Gorra trucker ------------------------------- */
function GorraTrucker({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Copa */}
      <Path
        data="M120 270 C120 168 184 110 260 110 C336 110 400 168 400 270 L400 286 L120 286 Z"
        {...grad(color, { x: 140, y: 110 }, { x: 380, y: 290 })}
        {...SOFT_SHADOW}
      />
      {/* Panel frontal visible (más claro) */}
      <Path data="M186 150 C210 132 310 132 334 150 L342 282 L178 282 Z" fill="#F8F9FA" opacity={0.16} />
      <Path data="M186 150 C210 132 310 132 334 150" stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
      {/* Malla lateral sugerida */}
      {[148, 160, 172].map((x) => (
        <Line key={`l${x}`} points={[x, 168, x, 280]} stroke={color.shadowHex} strokeWidth={1.5} opacity={0.22} />
      ))}
      {[348, 360, 372].map((x) => (
        <Line key={`r${x}`} points={[x, 168, x, 280]} stroke={color.shadowHex} strokeWidth={1.5} opacity={0.22} />
      ))}
      {/* Costura central y botón */}
      <Line points={[260, 116, 260, 282]} stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
      <Circle x={260} y={108} radius={7} fill={color.shadowHex} />
      {/* Visera plana */}
      <Path
        data="M112 286 C170 312 350 312 408 286 C432 300 446 322 446 344 C360 384 160 384 74 344 C76 322 92 300 112 286 Z"
        {...grad(color, { x: 260, y: 286 }, { x: 260, y: 384 })}
        shadowColor="#000000"
        shadowBlur={16}
        shadowOpacity={0.4}
        shadowOffsetY={10}
      />
      <Path data="M112 286 C170 312 350 312 408 286" stroke={color.shadowHex} strokeWidth={3} opacity={0.8} />
    </Group>
  );
}

/* --------------------------- Gorra clásica ------------------------------- */
function GorraClasica({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Copa curva */}
      <Path
        data="M124 280 C124 178 186 116 260 116 C334 116 396 178 396 280 C340 300 180 300 124 280 Z"
        {...grad(color, { x: 150, y: 120 }, { x: 380, y: 290 })}
        {...SOFT_SHADOW}
      />
      {/* Paneles */}
      <Line points={[260, 122, 260, 288]} stroke={color.shadowHex} strokeWidth={2} opacity={0.45} />
      <Path data="M212 132 C196 186 186 240 188 286" stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
      <Path data="M308 132 C324 186 334 240 332 286" stroke={color.shadowHex} strokeWidth={2} opacity={0.4} />
      {/* Ojales y botón */}
      <Circle x={228} y={198} radius={3} fill={color.shadowHex} opacity={0.6} />
      <Circle x={292} y={198} radius={3} fill={color.shadowHex} opacity={0.6} />
      <Circle x={260} y={120} radius={6} fill={color.shadowHex} />
      {/* Visera curva */}
      <Path
        data="M132 286 C182 304 338 304 388 286 C414 304 422 332 408 356 C350 390 170 390 112 356 C98 332 106 304 132 286 Z"
        {...grad(color, { x: 260, y: 286 }, { x: 260, y: 388 })}
        shadowColor="#000000"
        shadowBlur={16}
        shadowOpacity={0.4}
        shadowOffsetY={9}
      />
      <Path data="M132 286 C182 304 338 304 388 286" stroke={color.shadowHex} strokeWidth={3} opacity={0.75} />
    </Group>
  );
}

/* ------------------------------- Tote ------------------------------------ */
function Tote({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      <Path data="M196 218 C196 124 240 100 260 100 C280 100 324 124 324 218" stroke={color.shadowHex} strokeWidth={16} lineCap="round" shadowColor="#000000" shadowBlur={10} shadowOpacity={0.3} />
      <Rect
        x={140}
        y={214}
        width={240}
        height={346}
        cornerRadius={10}
        {...grad(color, { x: 150, y: 220 }, { x: 380, y: 560 })}
        {...SOFT_SHADOW}
      />
      <Line points={[148, 238, 372, 238]} stroke={color.shadowHex} strokeWidth={2} dash={[6, 5]} opacity={0.8} />
      <Rect x={140} y={214} width={16} height={346} cornerRadius={10} fill="#000000" opacity={0.1} />
      <Rect x={364} y={214} width={16} height={346} cornerRadius={10} fill="#000000" opacity={0.1} />
    </Group>
  );
}

export default function GarmentMockup({ mockupKey, side, color }: MockupProps) {
  switch (mockupKey) {
    case "sudadera":
      return <Sudadera side={side} color={color} />;
    case "gorra-trucker":
      return <GorraTrucker color={color} />;
    case "gorra-clasica":
      return <GorraClasica color={color} />;
    case "tote":
      return <Tote color={color} />;
    case "playera":
    default:
      return <Playera side={side} color={color} />;
  }
}

/** Sombra de piso reutilizable bajo el producto. */
export function FloorShadow({ stageWidth, stageHeight }: { stageWidth: number; stageHeight: number }) {
  return (
    <Ellipse
      x={stageWidth / 2}
      y={stageHeight - 24}
      radiusX={stageWidth * 0.3}
      radiusY={15}
      fill="#000000"
      opacity={0.32}
      listening={false}
    />
  );
}

"use client";

import { Circle, Ellipse, Group, Line, Path, Rect } from "react-konva";
import type { MockupKey } from "@/lib/designer/product-views";

/**
 * Mockups vectoriales del Laboratorio (Etapa 2).
 *
 * Son siluetas premium con gradiente y sombras suaves: más realistas que el
 * dibujo plano de Etapa 1, sin depender de imágenes externas.
 *
 * CÓMO USAR MOCKUPS REALES: cuando existan PNG por color, declara
 *   mockupByColor en src/lib/designer/product-views.ts y el lienzo
 *   (MultiAssetCanvas) usará la imagen en vez de este vector. No se borra
 *   este fallback: sigue cubriendo colores sin foto.
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

function grad(color: MockupColor, from: { x: number; y: number }, to: { x: number; y: number }) {
  return {
    fillLinearGradientStartPoint: from,
    fillLinearGradientEndPoint: to,
    fillLinearGradientColorStops: [0, color.hex, 1, color.shadowHex] as (string | number)[],
  };
}

function Playera({ side, color }: { side: "front" | "back"; color: MockupColor }) {
  return (
    <Group listening={false}>
      <Path
        data="M260 92 C236 92 218 99 205 109 L122 137 C113 140 108 149 111 158 L132 222 C135 231 144 236 153 233 L182 224 L182 488 C182 501 192 511 205 511 L315 511 C328 511 338 501 338 488 L338 224 L367 233 C376 236 385 231 388 222 L409 158 C412 149 407 140 398 137 L315 109 C302 99 284 92 260 92 Z"
        {...grad(color, { x: 140, y: 100 }, { x: 400, y: 520 })}
        shadowColor="#000000"
        shadowBlur={28}
        shadowOpacity={0.5}
        shadowOffsetY={14}
      />
      {/* Volumen lateral */}
      <Path data="M182 230 L182 488 C182 501 192 511 205 511 L216 511 C204 420 202 320 207 226 Z" fill="#000000" opacity={0.1} />
      <Path data="M338 230 L338 488 C338 501 328 511 315 511 L304 511 C316 420 318 320 313 226 Z" fill="#000000" opacity={0.1} />
      {side === "front" ? (
        <>
          <Path data="M218 97 C228 117 292 117 302 97 C290 110 230 110 218 97 Z" fill={color.shadowHex} />
          <Path data="M216 95 C230 119 290 119 304 95" stroke={color.shadowHex} strokeWidth={5} lineCap="round" />
        </>
      ) : (
        <Path data="M214 96 C232 110 288 110 306 96 C296 104 224 104 214 96 Z" fill={color.shadowHex} opacity={0.7} />
      )}
      <Line points={[182, 226, 158, 232]} stroke={color.shadowHex} strokeWidth={2} opacity={0.7} />
      <Line points={[338, 226, 362, 232]} stroke={color.shadowHex} strokeWidth={2} opacity={0.7} />
    </Group>
  );
}

function Sudadera({ side, color }: { side: "front" | "back"; color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Capucha (detrás del cuerpo) */}
      <Path
        data="M205 120 C220 86 320 86 335 120 C322 150 218 150 205 120 Z"
        {...grad(color, { x: 205, y: 90 }, { x: 335, y: 150 })}
        shadowColor="#000000"
        shadowBlur={16}
        shadowOpacity={0.35}
      />
      {/* Cuerpo más ancho */}
      <Path
        data="M270 118 C244 118 224 126 210 138 L120 170 C111 173 106 182 109 191 L132 256 C135 265 144 270 153 267 L186 256 L186 506 C186 520 196 530 210 530 L330 530 C344 530 354 520 354 506 L354 256 L387 267 C396 270 405 265 408 256 L431 191 C434 182 429 173 420 170 L330 138 C316 126 296 118 270 118 Z"
        {...grad(color, { x: 130, y: 130 }, { x: 420, y: 540 })}
        shadowColor="#000000"
        shadowBlur={30}
        shadowOpacity={0.5}
        shadowOffsetY={16}
      />
      {/* Puños y ribete inferior (rib) */}
      <Rect x={186} y={512} width={168} height={18} cornerRadius={4} fill="#000000" opacity={0.12} />
      <Path data="M150 262 L186 256 L186 280 L150 286 Z" fill="#000000" opacity={0.12} />
      <Path data="M390 262 L354 256 L354 280 L390 286 Z" fill="#000000" opacity={0.12} />
      {side === "front" ? (
        <>
          {/* Cuello redondo */}
          <Path data="M226 122 C238 142 302 142 314 122 C302 134 238 134 226 122 Z" fill={color.shadowHex} />
          {/* Bolsillo canguro */}
          <Path data="M214 396 L326 396 L318 462 L222 462 Z" fill="#000000" opacity={0.1} />
          <Line points={[214, 396, 326, 396]} stroke={color.shadowHex} strokeWidth={2} opacity={0.6} />
        </>
      ) : (
        <Path data="M224 120 C240 132 300 132 316 120 C304 128 236 128 224 120 Z" fill={color.shadowHex} opacity={0.7} />
      )}
    </Group>
  );
}

function GorraTrucker({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Copa */}
      <Path
        data="M118 268 C118 162 182 106 260 106 C338 106 402 162 402 268 L402 286 L118 286 Z"
        {...grad(color, { x: 140, y: 110 }, { x: 380, y: 290 })}
        shadowColor="#000000"
        shadowBlur={26}
        shadowOpacity={0.5}
        shadowOffsetY={12}
      />
      <Circle x={260} y={108} radius={7} fill={color.shadowHex} />
      <Line points={[190, 130, 186, 284]} stroke={color.shadowHex} strokeWidth={2} opacity={0.6} />
      <Line points={[330, 130, 334, 284]} stroke={color.shadowHex} strokeWidth={2} opacity={0.6} />
      {/* Visera plana de trucker */}
      <Path
        data="M112 284 C170 312 350 312 408 284 C430 298 444 318 446 340 C360 380 160 380 74 340 C76 318 90 298 112 284 Z"
        {...grad(color, { x: 260, y: 284 }, { x: 260, y: 380 })}
        shadowColor="#000000"
        shadowBlur={18}
        shadowOpacity={0.4}
        shadowOffsetY={10}
      />
      <Path data="M112 284 C170 312 350 312 408 284" stroke={color.shadowHex} strokeWidth={3} opacity={0.8} />
    </Group>
  );
}

function GorraClasica({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      {/* Copa curva 6 paneles */}
      <Path
        data="M124 276 C124 176 184 116 260 116 C336 116 396 176 396 276 C340 296 180 296 124 276 Z"
        {...grad(color, { x: 150, y: 120 }, { x: 380, y: 290 })}
        shadowColor="#000000"
        shadowBlur={26}
        shadowOpacity={0.5}
        shadowOffsetY={12}
      />
      <Circle x={260} y={120} radius={6} fill={color.shadowHex} />
      <Line points={[260, 124, 260, 286]} stroke={color.shadowHex} strokeWidth={2} opacity={0.5} />
      <Line points={[200, 134, 176, 282]} stroke={color.shadowHex} strokeWidth={2} opacity={0.45} />
      <Line points={[320, 134, 344, 282]} stroke={color.shadowHex} strokeWidth={2} opacity={0.45} />
      {/* Eyelets */}
      <Circle x={228} y={196} radius={3} fill={color.shadowHex} opacity={0.6} />
      <Circle x={292} y={196} radius={3} fill={color.shadowHex} opacity={0.6} />
      {/* Visera curva */}
      <Path
        data="M130 282 C180 300 340 300 390 282 C412 300 420 326 408 350 C350 384 170 384 112 350 C100 326 108 300 130 282 Z"
        {...grad(color, { x: 260, y: 282 }, { x: 260, y: 384 })}
        shadowColor="#000000"
        shadowBlur={16}
        shadowOpacity={0.4}
        shadowOffsetY={8}
      />
      <Path data="M130 282 C180 300 340 300 390 282" stroke={color.shadowHex} strokeWidth={3} opacity={0.75} />
    </Group>
  );
}

function Tote({ color }: { color: MockupColor }) {
  return (
    <Group listening={false}>
      <Path
        data="M196 218 C196 124 240 100 260 100 C280 100 324 124 324 218"
        stroke={color.shadowHex}
        strokeWidth={16}
        lineCap="round"
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.3}
      />
      <Rect
        x={140}
        y={214}
        width={240}
        height={346}
        cornerRadius={10}
        {...grad(color, { x: 150, y: 220 }, { x: 380, y: 560 })}
        shadowColor="#000000"
        shadowBlur={26}
        shadowOpacity={0.5}
        shadowOffsetY={14}
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

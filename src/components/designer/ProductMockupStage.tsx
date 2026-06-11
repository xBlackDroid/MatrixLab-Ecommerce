"use client";

import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Ellipse,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Path,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import PrintAreaOverlay from "@/components/designer/PrintAreaOverlay";
import type {
  BaseColorOption,
  DesignTransform,
  ProductTypeConfig,
  ZoneConfig,
} from "@/lib/designer/types";

/**
 * Stage del diseñador: mockup vectorial "3D-like" (sombras + gradientes),
 * área imprimible y arte del cliente con mover/escalar/rotar.
 * Este módulo SOLO se carga vía dynamic import (ssr: false) en las rutas del
 * diseñador: nunca en landing ni en la home de la tienda.
 */

interface ProductMockupStageProps {
  config: ProductTypeConfig;
  baseColor: BaseColorOption;
  zone: ZoneConfig;
  image: HTMLImageElement | null;
  transform: DesignTransform;
  withinBounds: boolean;
  onTransformChange: (transform: DesignTransform) => void;
  onStageReady: (stage: Konva.Stage | null) => void;
}

function PlayeraMockup({ color }: { color: BaseColorOption }) {
  return (
    <Group listening={false}>
      {/* Cuerpo de la playera */}
      <Path
        data="M260 92 C236 92 218 99 205 109 L122 137 C113 140 108 149 111 158 L132 222 C135 231 144 236 153 233 L182 224 L182 488 C182 501 192 511 205 511 L315 511 C328 511 338 501 338 488 L338 224 L367 233 C376 236 385 231 388 222 L409 158 C412 149 407 140 398 137 L315 109 C302 99 284 92 260 92 Z"
        fillLinearGradientStartPoint={{ x: 140, y: 100 }}
        fillLinearGradientEndPoint={{ x: 400, y: 520 }}
        fillLinearGradientColorStops={[0, color.hex, 1, color.shadowHex]}
        shadowColor="#000000"
        shadowBlur={28}
        shadowOpacity={0.5}
        shadowOffsetY={14}
      />
      {/* Sombras laterales para volumen */}
      <Path
        data="M182 230 L182 488 C182 501 192 511 205 511 L218 511 C205 420 203 320 208 226 Z"
        fill="#000000"
        opacity={0.12}
      />
      <Path
        data="M338 230 L338 488 C338 501 328 511 315 511 L302 511 C315 420 317 320 312 226 Z"
        fill="#000000"
        opacity={0.12}
      />
      {/* Cuello */}
      <Path
        data="M218 97 C228 117 292 117 302 97 C290 110 230 110 218 97 Z"
        fill={color.shadowHex}
      />
      <Path
        data="M216 95 C230 119 290 119 304 95"
        stroke={color.shadowHex}
        strokeWidth={5}
        lineCap="round"
      />
      {/* Costuras de mangas */}
      <Line
        points={[182, 226, 158, 232]}
        stroke={color.shadowHex}
        strokeWidth={2}
        opacity={0.7}
      />
      <Line
        points={[338, 226, 362, 232]}
        stroke={color.shadowHex}
        strokeWidth={2}
        opacity={0.7}
      />
    </Group>
  );
}

function GorraMockup({ color }: { color: BaseColorOption }) {
  return (
    <Group listening={false}>
      {/* Copa */}
      <Path
        data="M118 268 C118 162 182 106 260 106 C338 106 402 162 402 268 L402 286 L118 286 Z"
        fillLinearGradientStartPoint={{ x: 140, y: 110 }}
        fillLinearGradientEndPoint={{ x: 380, y: 290 }}
        fillLinearGradientColorStops={[0, color.hex, 1, color.shadowHex]}
        shadowColor="#000000"
        shadowBlur={26}
        shadowOpacity={0.5}
        shadowOffsetY={12}
      />
      {/* Paneles */}
      <Line
        points={[190, 130, 186, 284]}
        stroke={color.shadowHex}
        strokeWidth={2}
        opacity={0.65}
        bezier={false}
      />
      <Line
        points={[330, 130, 334, 284]}
        stroke={color.shadowHex}
        strokeWidth={2}
        opacity={0.65}
      />
      {/* Botón superior */}
      <Circle x={260} y={108} radius={7} fill={color.shadowHex} />
      {/* Visera */}
      <Path
        data="M112 284 C170 312 350 312 408 284 C428 296 440 314 442 332 C360 372 160 372 78 332 C80 314 92 296 112 284 Z"
        fillLinearGradientStartPoint={{ x: 260, y: 284 }}
        fillLinearGradientEndPoint={{ x: 260, y: 372 }}
        fillLinearGradientColorStops={[0, color.hex, 1, color.shadowHex]}
        shadowColor="#000000"
        shadowBlur={18}
        shadowOpacity={0.4}
        shadowOffsetY={10}
      />
      <Path
        data="M112 284 C170 312 350 312 408 284"
        stroke={color.shadowHex}
        strokeWidth={3}
        opacity={0.8}
      />
    </Group>
  );
}

function ToteMockup({ color }: { color: BaseColorOption }) {
  return (
    <Group listening={false}>
      {/* Asas */}
      <Path
        data="M196 218 C196 124 240 100 260 100 C280 100 324 124 324 218"
        stroke={color.shadowHex}
        strokeWidth={16}
        lineCap="round"
        shadowColor="#000000"
        shadowBlur={10}
        shadowOpacity={0.3}
      />
      {/* Cuerpo de la bolsa */}
      <Rect
        x={140}
        y={214}
        width={240}
        height={346}
        cornerRadius={10}
        fillLinearGradientStartPoint={{ x: 150, y: 220 }}
        fillLinearGradientEndPoint={{ x: 380, y: 560 }}
        fillLinearGradientColorStops={[0, color.hex, 1, color.shadowHex]}
        shadowColor="#000000"
        shadowBlur={26}
        shadowOpacity={0.5}
        shadowOffsetY={14}
      />
      {/* Costura superior */}
      <Line
        points={[148, 238, 372, 238]}
        stroke={color.shadowHex}
        strokeWidth={2}
        dash={[6, 5]}
        opacity={0.8}
      />
      {/* Pliegues laterales */}
      <Rect x={140} y={214} width={16} height={346} cornerRadius={10} fill="#000000" opacity={0.1} />
      <Rect x={364} y={214} width={16} height={346} cornerRadius={10} fill="#000000" opacity={0.1} />
    </Group>
  );
}

export default function ProductMockupStage({
  config,
  baseColor,
  zone,
  image,
  transform,
  withinBounds,
  onTransformChange,
  onStageReady,
}: ProductMockupStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const imageRef = useRef<Konva.Image | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

  // Escalado responsivo: coordenadas lógicas constantes, render adaptado.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? config.stage.width;
      setDisplayScale(Math.min(1, width / config.stage.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [config.stage.width]);

  // Adjuntar transformer al arte cuando existe.
  useEffect(() => {
    const transformer = transformerRef.current;
    const node = imageRef.current;
    if (!transformer) return;
    if (image && node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [image, zone.id]);

  function commitFromNode(node: Konva.Image) {
    // Mantener escala uniforme y rotación normalizada a [-180, 180].
    let rotation = node.rotation() % 360;
    if (rotation > 180) rotation -= 360;
    if (rotation < -180) rotation += 360;
    onTransformChange({
      x: node.x(),
      y: node.y(),
      scale: Math.min(Math.max(node.scaleX(), 0.1), 5),
      rotation,
    });
  }

  const Mockup =
    config.id === "playera"
      ? PlayeraMockup
      : config.id === "gorra"
        ? GorraMockup
        : ToteMockup;

  return (
    <div ref={containerRef} className="w-full">
      <Stage
        ref={(node) => {
          stageRef.current = node;
          onStageReady(node);
        }}
        width={config.stage.width * displayScale}
        height={config.stage.height * displayScale}
        scaleX={displayScale}
        scaleY={displayScale}
        className="mx-auto"
        style={{ touchAction: "none" }}
      >
        <Layer>
          {/* Fondo del laboratorio */}
          <Rect
            x={0}
            y={0}
            width={config.stage.width}
            height={config.stage.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{
              x: config.stage.width,
              y: config.stage.height,
            }}
            fillLinearGradientColorStops={[0, "#111626", 1, "#0B0F19"]}
          />
          <Ellipse
            x={config.stage.width / 2}
            y={config.stage.height - 24}
            radiusX={config.stage.width * 0.32}
            radiusY={16}
            fill="#000000"
            opacity={0.35}
          />
          <Mockup color={baseColor} />
        </Layer>

        <Layer>
          {image && (
            <KonvaImage
              ref={imageRef}
              image={image}
              x={transform.x}
              y={transform.y}
              offsetX={image.width / 2}
              offsetY={image.height / 2}
              scaleX={transform.scale}
              scaleY={transform.scale}
              rotation={transform.rotation}
              draggable
              onDragEnd={(event) => commitFromNode(event.target as Konva.Image)}
              onTransformEnd={(event) =>
                commitFromNode(event.target as Konva.Image)
              }
            />
          )}
          <PrintAreaOverlay
            safeArea={zone.safeArea}
            withinBounds={withinBounds}
            visible
          />
          {image && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio
              enabledAnchors={[
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
              ]}
              anchorSize={11}
              anchorCornerRadius={6}
              anchorStroke="#B197FC"
              anchorFill="#0B0F19"
              borderStroke="#B197FC"
              borderDash={[4, 4]}
              rotateAnchorOffset={26}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

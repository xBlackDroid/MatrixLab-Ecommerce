"use client";

import { useEffect, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Transformer } from "react-konva";
import type Konva from "konva";
import GarmentMockup, {
  FloorShadow,
  type MockupColor,
} from "@/components/designer/mockups/GarmentMockups";
import PrintAreaOverlay from "@/components/designer/PrintAreaOverlay";
import {
  getMockupSrc,
  type GarmentProfileVisual,
  type MockupKey,
} from "@/lib/designer/product-views";
import type { PlacedAsset, SafeArea } from "@/lib/designer/types";

/**
 * Lienzo Konva multi-imagen para prendas (Etapa 2).
 *
 * Solo se carga vía dynamic import (ssr:false) dentro de GarmentDesigner:
 * Konva nunca entra al bundle de la landing ni de la tienda. Cada asset se
 * mueve/escala/rota de forma independiente; el área imprimible se resalta y
 * cambia a coral si el asset seleccionado se sale.
 */

export interface AssetTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface MultiAssetCanvasProps {
  stage: { width: number; height: number };
  mockupKey: MockupKey;
  colorId: string;
  profile?: GarmentProfileVisual;
  color: MockupColor;
  side: "front" | "back";
  safeArea: SafeArea;
  assets: PlacedAsset[];
  images: Record<string, HTMLImageElement>;
  selectedId: string | null;
  withinBounds: boolean;
  onSelect: (id: string | null) => void;
  onChange: (id: string, transform: AssetTransform) => void;
  onStageReady: (stage: Konva.Stage | null) => void;
}

export default function MultiAssetCanvas({
  stage,
  mockupKey,
  colorId,
  profile,
  color,
  side,
  safeArea,
  assets,
  images,
  selectedId,
  withinBounds,
  onSelect,
  onChange,
  onStageReady,
}: MultiAssetCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Image | null>>({});
  const [displayScale, setDisplayScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? stage.width;
      setDisplayScale(Math.min(1, width / stage.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stage.width]);

  // Adjunta el transformer al asset seleccionado del lado actual.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, side, assets]);

  // Intenta cargar el PNG real del color; si no existe, usa el mockup vectorial.
  const mockupSrc = getMockupSrc(mockupKey, side, colorId);
  const [mockupImage, setMockupImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    let active = true;
    setMockupImage(null);
    const img = new window.Image();
    img.onload = () => {
      if (active) setMockupImage(img);
    };
    img.onerror = () => {
      if (active) setMockupImage(null);
    };
    img.src = mockupSrc;
    return () => {
      active = false;
    };
  }, [mockupSrc]);

  function commit(asset: PlacedAsset, node: Konva.Image) {
    let rotation = node.rotation() % 360;
    if (rotation > 180) rotation -= 360;
    if (rotation < -180) rotation += 360;
    onChange(asset.id, {
      x: node.x(),
      y: node.y(),
      scale: Math.min(Math.max(node.scaleX(), 0.05), 12),
      rotation,
    });
  }

  return (
    <div ref={containerRef} className="w-full">
      <Stage
        ref={(node) => {
          onStageReady(node);
        }}
        width={stage.width * displayScale}
        height={stage.height * displayScale}
        scaleX={displayScale}
        scaleY={displayScale}
        className="mx-auto"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={stage.width}
            height={stage.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: stage.width, y: stage.height }}
            fillLinearGradientColorStops={[0, "#111626", 1, "#0B0F19"]}
          />
          <FloorShadow stageWidth={stage.width} stageHeight={stage.height} />
          {mockupImage ? (
            <KonvaImage
              image={mockupImage}
              x={0}
              y={0}
              width={stage.width}
              height={stage.height}
              listening={false}
            />
          ) : (
            <GarmentMockup
              mockupKey={mockupKey}
              side={side}
              color={color}
              profile={profile}
            />
          )}
        </Layer>

        <Layer>
          {assets.map((asset) => {
            const image = images[asset.id];
            if (!image) return null;
            return (
              <KonvaImage
                key={asset.id}
                image={image}
                ref={(node) => {
                  nodeRefs.current[asset.id] = node;
                }}
                x={asset.x}
                y={asset.y}
                offsetX={asset.naturalWidth / 2}
                offsetY={asset.naturalHeight / 2}
                scaleX={asset.scale}
                scaleY={asset.scale}
                rotation={asset.rotation}
                draggable
                onMouseDown={() => onSelect(asset.id)}
                onTouchStart={() => onSelect(asset.id)}
                onDragEnd={(e) => commit(asset, e.target as Konva.Image)}
                onTransformEnd={(e) => commit(asset, e.target as Konva.Image)}
              />
            );
          })}

          <PrintAreaOverlay safeArea={safeArea} withinBounds={withinBounds} visible />

          {selectedId && (
            <Transformer
              ref={transformerRef}
              rotateEnabled
              keepRatio
              enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
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

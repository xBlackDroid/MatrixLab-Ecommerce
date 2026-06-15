"use client";

import { useEffect, useRef, useState } from "react";
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { LASER_PX_PER_CM, type LaserTemplate } from "@/lib/designer/laser-config";
import type { LaserEditorElement } from "@/lib/designer/types";

export interface LaserTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface LaserCanvasProps {
  workAreaCm: { width: number; height: number };
  safeAreaCm: { width: number; height: number; xCm: number; yCm: number };
  template: LaserTemplate;
  elements: LaserEditorElement[];
  images: Record<string, HTMLImageElement>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, transform: LaserTransform) => void;
  onStageReady: (stage: Konva.Stage | null) => void;
}

export default function LaserCanvas({
  workAreaCm,
  safeAreaCm,
  template,
  elements,
  images,
  selectedId,
  onSelect,
  onChange,
  onStageReady,
}: LaserCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Record<string, Konva.Node | null>>({});
  const [displayScale, setDisplayScale] = useState(1);
  const px = LASER_PX_PER_CM;
  const stageW = workAreaCm.width * px;
  const stageH = workAreaCm.height * px;

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

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedId ? nodeRefs.current[selectedId] : null;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedId, elements]);

  function commit(id: string, node: Konva.Node) {
    let rotation = node.rotation() % 360;
    if (rotation > 180) rotation -= 360;
    if (rotation < -180) rotation += 360;
    onChange(id, {
      x: node.x(),
      y: node.y(),
      scale: Math.min(Math.max(node.scaleX(), 0.05), 12),
      rotation,
    });
  }

  // Plantilla centrada en el área de trabajo.
  const tplW = template.sizeCm.width * px;
  const tplH = template.sizeCm.height * px;
  const tplX = (stageW - tplW) / 2;
  const tplY = (stageH - tplH) / 2;

  return (
    <div ref={containerRef} className="w-full">
      <Stage
        ref={(node) => onStageReady(node)}
        width={stageW * displayScale}
        height={stageH * displayScale}
        scaleX={displayScale}
        scaleY={displayScale}
        className="mx-auto"
        style={{ touchAction: "none" }}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) onSelect(null);
        }}
      >
        <Layer listening={false}>
          <Rect x={0} y={0} width={stageW} height={stageH} fill="#111626" />
          {/* Área segura (área total menos 15%) */}
          <Rect
            x={safeAreaCm.xCm * px}
            y={safeAreaCm.yCm * px}
            width={safeAreaCm.width * px}
            height={safeAreaCm.height * px}
            stroke="#4DCEFF"
            strokeWidth={1.5}
            dash={[8, 6]}
          />
          <Text
            x={safeAreaCm.xCm * px}
            y={safeAreaCm.yCm * px - 18}
            text="Área segura de la cortadora"
            fontSize={12}
            fontStyle="bold"
            fill="#4DCEFF"
          />
          {/* Plantilla base */}
          {template.shape === "circle" ? (
            <Circle
              x={stageW / 2}
              y={stageH / 2}
              radius={Math.min(tplW, tplH) / 2}
              stroke="#B197FC"
              strokeWidth={2}
              fill="rgba(177,151,252,0.06)"
            />
          ) : (
            <Rect
              x={tplX}
              y={tplY}
              width={tplW}
              height={tplH}
              cornerRadius={template.shape === "rect" ? 4 : 18}
              stroke="#B197FC"
              strokeWidth={2}
              fill="rgba(177,151,252,0.06)"
            />
          )}
          <Text
            x={tplX}
            y={tplY + tplH + 6}
            width={tplW}
            align="center"
            text={template.label}
            fontSize={12}
            fill="#B197FC"
          />
        </Layer>

        <Layer>
          {elements.map((el) => {
            if (el.type === "image") {
              const img = images[el.id];
              if (!img) return null;
              return (
                <KonvaImage
                  key={el.id}
                  image={img}
                  ref={(node) => {
                    nodeRefs.current[el.id] = node;
                  }}
                  x={el.x}
                  y={el.y}
                  offsetX={img.width / 2}
                  offsetY={img.height / 2}
                  scaleX={el.scale}
                  scaleY={el.scale}
                  rotation={el.rotation}
                  draggable
                  onMouseDown={() => onSelect(el.id)}
                  onTouchStart={() => onSelect(el.id)}
                  onDragEnd={(e) => commit(el.id, e.target)}
                  onTransformEnd={(e) => commit(el.id, e.target)}
                />
              );
            }
            return (
              <Text
                key={el.id}
                ref={(node) => {
                  nodeRefs.current[el.id] = node;
                }}
                text={el.text}
                fontFamily={el.fontFamily}
                fontSize={el.fontSize}
                fill="#F8F9FA"
                x={el.x}
                y={el.y}
                scaleX={el.scale}
                scaleY={el.scale}
                rotation={el.rotation}
                draggable
                onMouseDown={() => onSelect(el.id)}
                onTouchStart={() => onSelect(el.id)}
                onDragEnd={(e) => commit(el.id, e.target)}
                onTransformEnd={(e) => commit(el.id, e.target)}
              />
            );
          })}
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

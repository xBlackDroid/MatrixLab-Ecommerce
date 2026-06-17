"use client";

import { useEffect, useRef, useState } from "react";
import { Circle, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import {
  LASER_PADDING_CM,
  LASER_PX_PER_CM,
  LASER_SAFE_INSET_RATIO,
  type LaserTemplate,
} from "@/lib/designer/laser-config";
import type { LaserTextElement } from "@/lib/designer/types";

export interface LaserTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface LaserCanvasProps {
  /** Dimensiones libres del área/plantilla (cm). */
  areaCm: { width: number; height: number };
  template: LaserTemplate;
  elements: LaserTextElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (id: string, transform: LaserTransform) => void;
  onStageReady: (stage: Konva.Stage | null) => void;
}

export default function LaserCanvas({
  areaCm,
  template,
  elements,
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
  const pad = LASER_PADDING_CM * px;
  const areaW = areaCm.width * px;
  const areaH = areaCm.height * px;
  const stageW = areaW + pad * 2;
  const stageH = areaH + pad * 2;
  const areaX = pad;
  const areaY = pad;
  const inset = Math.min(areaW, areaH) * LASER_SAFE_INSET_RATIO;

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

  const cornerRadius =
    template.shape === "rect"
      ? 4
      : template.shape === "pill"
        ? areaH / 2
        : 18;

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
          {/* Área / plantilla a las dimensiones elegidas. */}
          {template.shape === "circle" ? (
            <Circle
              x={areaX + areaW / 2}
              y={areaY + areaH / 2}
              radius={Math.min(areaW, areaH) / 2}
              stroke="#B197FC"
              strokeWidth={2}
              fill="rgba(177,151,252,0.06)"
            />
          ) : (
            <Rect
              x={areaX}
              y={areaY}
              width={areaW}
              height={areaH}
              cornerRadius={cornerRadius}
              stroke="#B197FC"
              strokeWidth={2}
              fill="rgba(177,151,252,0.06)"
            />
          )}
          {/* Área segura interna (guía). */}
          <Rect
            x={areaX + inset}
            y={areaY + inset}
            width={areaW - inset * 2}
            height={areaH - inset * 2}
            stroke="#4DCEFF"
            strokeWidth={1.25}
            dash={[8, 6]}
          />
          <Text
            x={areaX}
            y={areaY - 20}
            width={areaW}
            align="center"
            text={`${template.label} · ${areaCm.width} × ${areaCm.height} cm`}
            fontSize={12}
            fontStyle="bold"
            fill="#B197FC"
          />
        </Layer>

        <Layer>
          {elements.map((el) => (
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
          ))}
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

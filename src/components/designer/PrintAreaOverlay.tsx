"use client";

import { Group, Rect, Text } from "react-konva";
import type { SafeArea } from "@/lib/designer/types";

/**
 * Overlay del área imprimible dentro del stage de Konva.
 * Cambia a coral cuando el arte se sale del área segura.
 */
export default function PrintAreaOverlay({
  safeArea,
  withinBounds,
  visible,
}: {
  safeArea: SafeArea;
  withinBounds: boolean;
  visible: boolean;
}) {
  if (!visible) return null;
  const stroke = withinBounds ? "#4DCEFF" : "#FF8787";
  const tick = 14;

  return (
    <Group listening={false}>
      <Rect
        x={safeArea.x}
        y={safeArea.y}
        width={safeArea.width}
        height={safeArea.height}
        stroke={stroke}
        strokeWidth={1.5}
        dash={[7, 6]}
        cornerRadius={6}
        opacity={0.85}
      />
      {/* Marcas de esquina */}
      {(
        [
          [safeArea.x, safeArea.y, 1, 1],
          [safeArea.x + safeArea.width, safeArea.y, -1, 1],
          [safeArea.x, safeArea.y + safeArea.height, 1, -1],
          [safeArea.x + safeArea.width, safeArea.y + safeArea.height, -1, -1],
        ] as const
      ).map(([x, y, dx, dy], index) => (
        <Group key={index}>
          <Rect x={x} y={y} width={tick * dx} height={2 * dy} fill={stroke} />
          <Rect x={x} y={y} width={2 * dx} height={tick * dy} fill={stroke} />
        </Group>
      ))}
      <Text
        x={safeArea.x}
        y={safeArea.y - 22}
        width={safeArea.width}
        align="center"
        text={withinBounds ? "Área imprimible" : "Tu diseño se sale del área"}
        fontSize={12}
        fontStyle="bold"
        fill={stroke}
      />
    </Group>
  );
}

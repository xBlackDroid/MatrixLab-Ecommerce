"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Ruler, Trash2, Type } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { emitCartUpdated } from "@/components/store/CartBadge";
import DesignerCTA from "@/components/designer/DesignerCTA";
import LaserDisclaimer from "@/components/designer/laser/LaserDisclaimer";
import LaserTemplateSelector from "@/components/designer/laser/LaserTemplateSelector";
import LaserTextTool from "@/components/designer/laser/LaserTextTool";
import type { LaserTransform } from "@/components/designer/laser/LaserCanvas";
import { exportStagePreview } from "@/lib/designer/exportPreview";
import {
  clampLaserDim,
  getLaserTemplate,
  LASER_DEFAULT_CM,
  LASER_FONTS,
  LASER_MAX_CM,
  LASER_MIN_CM,
  LASER_PADDING_CM,
  LASER_PX_PER_CM,
  LASER_TEMPLATES,
} from "@/lib/designer/laser-config";
import type { LaserTextElement } from "@/lib/designer/types";
import type { ProductWithVariants } from "@/lib/db/types";
import type Konva from "konva";
import { cn } from "@/lib/utils";

const LaserCanvas = dynamic(
  () => import("@/components/designer/laser/LaserCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[5/3] w-full items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
      </div>
    ),
  },
);

export default function LaserDesigner({
  product,
}: {
  product: ProductWithVariants;
}) {
  const [templateId, setTemplateId] = useState(LASER_TEMPLATES[0]!.id);
  const [widthCm, setWidthCm] = useState<number>(LASER_DEFAULT_CM.width);
  const [heightCm, setHeightCm] = useState<number>(LASER_DEFAULT_CM.height);
  const [elements, setElements] = useState<LaserTextElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  // Modo previsualización cuando el backend (diseños) aún no está configurado.
  const [previewOnly, setPreviewOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");

  const stageRef = useRef<Konva.Stage | null>(null);

  const template = getLaserTemplate(templateId);
  const px = LASER_PX_PER_CM;
  const centerX = (LASER_PADDING_CM + widthCm / 2) * px;
  const centerY = (LASER_PADDING_CM + heightCm / 2) * px;

  const customVariant = useMemo(() => {
    const variants = product.variants ?? [];
    return (
      variants.find((v) => v.sku?.endsWith("-CUSTOM")) ?? variants[0] ?? null
    );
  }, [product.variants]);

  const markDirty = useCallback(() => setSaved(false), []);

  const ensureDesign = useCallback(async (): Promise<string | null> => {
    if (designId) return designId;
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: "laser",
          productId: product.id,
          ...(customVariant ? { variantId: customVariant.id } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.designId) {
        if (data?.code === "STORAGE_NOT_CONFIGURED" || res.status === 503) {
          setPreviewOnly(true);
          return null;
        }
        toast.error(data?.error ?? "No pudimos iniciar tu diseño.");
        return null;
      }
      setPreviewOnly(false);
      setDesignId(data.designId as string);
      return data.designId as string;
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
      return null;
    }
  }, [designId, product.id, customVariant]);

  function selectTemplate(id: string) {
    setTemplateId(id);
    // Sugerir las dimensiones de la forma elegida (siguen siendo editables).
    const tpl = getLaserTemplate(id);
    setWidthCm(clampLaserDim("width", tpl.sizeCm.width));
    setHeightCm(clampLaserDim("height", tpl.sizeCm.height));
    markDirty();
  }

  function changeWidth(value: number) {
    setWidthCm(clampLaserDim("width", value));
    markDirty();
  }

  function changeHeight(value: number) {
    setHeightCm(clampLaserDim("height", value));
    markDirty();
  }

  function addText(text: string, fontId: string) {
    const font = LASER_FONTS.find((f) => f.id === fontId) ?? LASER_FONTS[3];
    const localId = nanoid(8);
    setElements((prev) => [
      ...prev,
      {
        id: localId,
        type: "text",
        text,
        fontId,
        fontFamily: font.family,
        x: centerX,
        y: centerY,
        scale: 1,
        rotation: 0,
        fontSize: 48,
      },
    ]);
    setSelectedId(localId);
    markDirty();
    // Detecta temprano si el almacenamiento aún no está configurado.
    if (!designId && !previewOnly) void ensureDesign();
  }

  function updateElement(id: string, transform: LaserTransform) {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...transform } : el)),
    );
    markDirty();
  }

  function deleteElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
    markDirty();
  }

  function buildDesignJson() {
    return {
      version: 1 as const,
      designerType: "laser" as const,
      templateId,
      widthCm,
      heightCm,
      elements: elements.map((el) => ({
        type: "text" as const,
        text: el.text,
        fontId: el.fontId,
        x: el.x,
        y: el.y,
        scale: el.scale,
        rotation: el.rotation,
        fontSize: el.fontSize,
      })),
    };
  }

  async function saveDesign(showToast = true): Promise<string | null> {
    if (elements.length === 0) {
      toast.error("Agrega texto para guardar tu diseño.");
      return null;
    }
    const id = await ensureDesign();
    if (!id) return null;
    setSaving(true);
    try {
      const previewDataUrl = stageRef.current
        ? exportStagePreview(stageRef.current)
        : null;
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designerType: "laser",
          productType: "laser",
          productId: product.id,
          ...(customVariant ? { variantId: customVariant.id } : {}),
          ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
          designJson: buildDesignJson(),
          ...(previewDataUrl ? { previewDataUrl } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos guardar tu diseño.");
        return null;
      }
      setSaved(true);
      if (showToast) toast.success("Diseño guardado correctamente");
      return id;
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleAddToCart() {
    if (!customVariant) {
      toast.error("Este producto no está disponible por ahora.");
      return;
    }
    setAddingToCart(true);
    try {
      const id = await saveDesign(false);
      if (!id) return;
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: customVariant.id,
          quantity: 1,
          designProjectId: id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos agregarlo al carrito.");
        return;
      }
      emitCartUpdated();
      toast.success("¡Tu diseño está en el carrito!", {
        action: {
          label: "Ver carrito",
          onClick: () => {
            window.location.href = "/tienda/carrito";
          },
        },
      });
    } finally {
      setAddingToCart(false);
    }
  }

  const dimensionControl = (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2">
        <Ruler className="h-4 w-4 text-ml-cyan" aria-hidden />
        <p className="text-sm font-medium text-ml-white/80">
          Dimensiones del área
        </p>
      </div>
      <p className="mb-3 rounded-xl border border-ml-cyan/20 bg-ml-cyan/5 px-3.5 py-2.5 text-sm text-ml-cyan">
        Área seleccionada: <strong>{widthCm} cm</strong> ×{" "}
        <strong>{heightCm} cm</strong>
      </p>

      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-ml-white/70">Ancho</span>
        <span className="text-xs text-ml-white/50">{widthCm} cm</span>
      </div>
      <input
        type="range"
        min={LASER_MIN_CM.width}
        max={LASER_MAX_CM.width}
        step={0.5}
        value={widthCm}
        onChange={(e) => changeWidth(Number(e.target.value))}
        className="w-full accent-ml-violet"
        aria-label="Ancho del área en centímetros"
      />

      <div className="mb-1.5 mt-3 flex items-center justify-between">
        <span className="text-sm font-medium text-ml-white/70">Alto</span>
        <span className="text-xs text-ml-white/50">{heightCm} cm</span>
      </div>
      <input
        type="range"
        min={LASER_MIN_CM.height}
        max={LASER_MAX_CM.height}
        step={0.5}
        value={heightCm}
        onChange={(e) => changeHeight(Number(e.target.value))}
        className="w-full accent-ml-violet"
        aria-label="Alto del área en centímetros"
      />
      <p className="mt-3 text-xs text-ml-white/45">
        Rango permitido: {LASER_MIN_CM.width}×{LASER_MIN_CM.height} cm a{" "}
        {LASER_MAX_CM.width}×{LASER_MAX_CM.height} cm.
      </p>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="glass hidden h-fit rounded-2xl p-5 lg:block">
          <LaserTemplateSelector
            selectedId={templateId}
            onSelect={selectTemplate}
          />
        </aside>

        <section className="glass-strong relative overflow-hidden rounded-3xl p-3 sm:p-5">
          <LaserCanvas
            areaCm={{ width: widthCm, height: heightCm }}
            template={template}
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChange={updateElement}
            onStageReady={(s) => {
              stageRef.current = s;
            }}
          />
          <div className="mt-3 lg:hidden">
            <LaserTemplateSelector
              selectedId={templateId}
              onSelect={selectTemplate}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          {dimensionControl}

          <div className="glass rounded-2xl p-5">
            <LaserTextTool onAdd={addText} />
          </div>

          {elements.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="mb-2 text-sm font-medium text-ml-white/70">Textos</p>
              <ul className="flex flex-col gap-2">
                {elements.map((el) => (
                  <li
                    key={el.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2 transition",
                      selectedId === el.id
                        ? "border-ml-cyan bg-ml-cyan/10"
                        : "border-white/10 bg-white/5",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(el.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Type className="h-4 w-4 shrink-0 text-ml-violet" aria-hidden />
                      <span className="truncate text-xs text-ml-white/75">
                        {el.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteElement(el.id)}
                      aria-label="Eliminar"
                      className="rounded-md p-1.5 text-ml-white/50 transition hover:text-ml-coral"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <label
              htmlFor="laser-notes"
              className="mb-1.5 block text-sm font-medium text-ml-white/70"
            >
              Notas para el laboratorio (opcional)
            </label>
            <textarea
              id="laser-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              placeholder="Material, color de grabado o detalles…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
            />
          </div>

          <DesignerCTA
            canSave={elements.length > 0 && !previewOnly}
            canAddToCart={elements.length > 0 && !previewOnly}
            saving={saving}
            addingToCart={addingToCart}
            saved={saved}
            designId={designId}
            onSave={() => saveDesign(true)}
            onAddToCart={handleAddToCart}
            note={
              previewOnly
                ? "Estás en modo previsualización: puedes diseñar tu grabado de texto. Para guardar o agregar al carrito, termina de configurar el almacenamiento o escríbenos por WhatsApp."
                : undefined
            }
          />
        </aside>
      </div>

      <LaserDisclaimer />
    </>
  );
}

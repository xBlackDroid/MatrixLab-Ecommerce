"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImageIcon, Loader2, Trash2, Type, Upload } from "lucide-react";
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
  getLaserSafeAreaCm,
  getLaserTemplate,
  LASER_FONTS,
  LASER_PX_PER_CM,
  LASER_TEMPLATES,
  LASER_WORK_AREA_CM,
} from "@/lib/designer/laser-config";
import {
  validateDesignFile,
  validateImageDimensions,
} from "@/lib/designer/validation";
import { uploadDesignAsset } from "@/lib/uploads/uploadDesignAsset";
import type { LaserEditorElement } from "@/lib/designer/types";
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
  const [elements, setElements] = useState<LaserEditorElement[]>([]);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Modo previsualización cuando el backend (storage/diseños) aún no está listo.
  const [previewOnly, setPreviewOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");

  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef<string[]>([]);

  const template = getLaserTemplate(templateId);
  const safeArea = getLaserSafeAreaCm();
  const px = LASER_PX_PER_CM;
  const centerX = (LASER_WORK_AREA_CM.width / 2) * px;
  const centerY = (LASER_WORK_AREA_CM.height / 2) * px;

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

  async function handleImageUpload(file: File) {
    const validation = validateDesignFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    objectUrls.current.push(objectUrl);
    const img = await new Promise<HTMLImageElement | null>((resolve) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = objectUrl;
    });
    if (!img) {
      toast.error("No pudimos leer la imagen.");
      return;
    }
    const dims = validateImageDimensions(img.width, img.height);
    if (!dims.ok) {
      toast.error(dims.error);
      return;
    }
    // 1) Coloca la imagen en el lienzo de inmediato: diseñar/probar nunca se
    //    bloquea, aunque el storage todavía no esté configurado.
    const localId = nanoid(8);
    const fit = Math.min(
      (safeArea.width * px * 0.4) / img.width,
      (safeArea.height * px * 0.4) / img.height,
    );
    setImages((prev) => ({ ...prev, [localId]: img }));
    setElements((prev) => [
      ...prev,
      {
        id: localId,
        type: "image",
        assetId: "", // se completa al persistir en storage
        localUrl: objectUrl,
        remoteUrl: undefined,
        naturalWidth: img.width,
        naturalHeight: img.height,
        x: centerX,
        y: centerY,
        scale: Math.max(0.05, Math.min(fit || 0.5, 12)),
        rotation: 0,
      },
    ]);
    setSelectedId(localId);
    markDirty();

    // 2) Persiste en segundo plano. Si falta configuración, modo previsualización.
    setUploading(true);
    try {
      const id = await ensureDesign();
      if (!id) return;
      const result = await uploadDesignAsset({ file, designProjectId: id });
      if (!result.ok) {
        if (result.configPending) setPreviewOnly(true);
        else toast.error(result.message);
        return;
      }
      setPreviewOnly(false);
      setElements((prev) =>
        prev.map((el) =>
          el.id === localId && el.type === "image"
            ? { ...el, assetId: result.assetId, remoteUrl: result.signedUrl }
            : el,
        ),
      );
      toast.success("Imagen agregada");
    } finally {
      setUploading(false);
    }
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
      elements: elements.map((el) =>
        el.type === "image"
          ? {
              type: "image" as const,
              assetId: el.assetId,
              url: el.remoteUrl,
              x: el.x,
              y: el.y,
              scale: el.scale,
              rotation: el.rotation,
            }
          : {
              type: "text" as const,
              text: el.text,
              fontId: el.fontId,
              x: el.x,
              y: el.y,
              scale: el.scale,
              rotation: el.rotation,
              fontSize: el.fontSize,
            },
      ),
    };
  }

  async function saveDesign(showToast = true): Promise<string | null> {
    if (elements.length === 0) {
      toast.error("Agrega una imagen o texto para guardar tu diseño.");
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

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_300px]">
        <aside className="glass hidden h-fit rounded-2xl p-5 lg:block">
          <LaserTemplateSelector selectedId={templateId} onSelect={(id) => { setTemplateId(id); markDirty(); }} />
        </aside>

        <section className="glass-strong relative overflow-hidden rounded-3xl p-3 sm:p-5">
          <LaserCanvas
            workAreaCm={LASER_WORK_AREA_CM}
            safeAreaCm={safeArea}
            template={template}
            elements={elements}
            images={images}
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
              onSelect={(id) => {
                setTemplateId(id);
                markDirty();
              }}
            />
          </div>
        </section>

        <aside className="flex flex-col gap-5">
          <div className="glass rounded-2xl p-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-5 text-center transition hover:border-ml-violet/50 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-ml-violet" aria-hidden />
              ) : (
                <Upload className="h-6 w-6 text-ml-violet" aria-hidden />
              )}
              <span className="text-sm font-semibold">Subir imagen</span>
              <span className="text-xs text-ml-white/50">PNG, JPG o WEBP</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />
            <div className="mt-4">
              <LaserTextTool onAdd={addText} />
            </div>
          </div>

          {elements.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="mb-2 text-sm font-medium text-ml-white/70">Elementos</p>
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
                      {el.type === "image" ? (
                        <ImageIcon className="h-4 w-4 shrink-0 text-ml-violet" aria-hidden />
                      ) : (
                        <Type className="h-4 w-4 shrink-0 text-ml-violet" aria-hidden />
                      )}
                      <span className="truncate text-xs text-ml-white/75">
                        {el.type === "image" ? "Imagen" : el.text}
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
              placeholder="Material, medidas o detalles de tu grabado…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
            />
          </div>

          <DesignerCTA
            canSave={elements.length > 0 && !uploading && !previewOnly}
            canAddToCart={elements.length > 0 && !uploading && !previewOnly}
            saving={saving}
            addingToCart={addingToCart}
            saved={saved}
            designId={designId}
            onSave={() => saveDesign(true)}
            onAddToCart={handleAddToCart}
            note={
              previewOnly
                ? "Estás en modo previsualización: puedes diseñar tu grabado. Para guardar o agregar al carrito, termina de configurar el almacenamiento o escríbenos por WhatsApp."
                : undefined
            }
          />
        </aside>
      </div>

      <LaserDisclaimer />
    </>
  );
}

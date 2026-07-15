"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { emitCartUpdated } from "@/components/store/CartBadge";
import DesignerCTA from "@/components/designer/DesignerCTA";
import FreeLayoutSheet from "@/components/designer/sheets/FreeLayoutSheet";
import RepeatLayoutSheet from "@/components/designer/sheets/RepeatLayoutSheet";
import SheetDisclaimer from "@/components/designer/sheets/SheetDisclaimer";
import {
  clampToPrintable,
  computeRepeatPlacements,
  findSlot,
  type RectCm,
} from "@/components/designer/sheets/CollisionEngine";
import { exportStagePreview } from "@/lib/designer/exportPreview";
import { getCatalogEntry } from "@/lib/designer/product-catalog";
import {
  DEFAULT_PIECE_CM,
  LETTER_CM,
  MAX_FREE_IMAGES,
  MIN_SPACING_CM,
  PRINTABLE_AREA_CM,
  REPEAT_MAX_CM,
  REPEAT_MIN_CM,
} from "@/lib/designer/sheet-config";
import {
  validateDesignFile,
  validateImageDimensions,
} from "@/lib/designer/validation";
import { uploadDesignAsset } from "@/lib/uploads/uploadDesignAsset";
import type { DesignerProductType, ProductWithVariants } from "@/lib/db/types";
import type Konva from "konva";
import type { SheetPiece } from "@/lib/designer/types";

const SheetCanvas = dynamic(
  () => import("@/components/designer/sheets/SheetCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[3/4] w-full items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
      </div>
    ),
  },
);

type Shape = "square" | "circle" | "rectangle";

interface RepeatBase {
  assetId: string;
  localUrl: string;
  remoteUrl?: string;
  image: HTMLImageElement;
  naturalWidth: number;
  naturalHeight: number;
}

interface SheetDesignerProps {
  productType: DesignerProductType;
  product: ProductWithVariants;
  /**
   * true cuando el producto base no existe en el catálogo real y `product` es
   * el respaldo de previsualización: se arma la planilla y se cotiza por
   * WhatsApp, sin persistir nada (guardar/carrito deshabilitados).
   */
  previewOnly?: boolean;
}

const AREA = PRINTABLE_AREA_CM;

export default function SheetDesigner({
  productType,
  product,
  previewOnly: catalogPreview = false,
}: SheetDesignerProps) {
  const entry = getCatalogEntry(productType);
  const sheetType = entry.sheetType ?? "stickers";
  const mode = entry.sheetMode ?? "free";

  const [designId, setDesignId] = useState<string | null>(null);
  const [pieces, setPieces] = useState<SheetPiece[]>([]);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [repeatBase, setRepeatBase] = useState<RepeatBase | null>(null);
  const [shape, setShape] = useState<Shape>("square");
  const [pieceW, setPieceW] = useState(DEFAULT_PIECE_CM);
  const [pieceH, setPieceH] = useState(DEFAULT_PIECE_CM);

  const [uploading, setUploading] = useState(false);
  // Modo previsualización cuando el backend (storage/diseños) aún no está
  // listo, o cuando el producto base no existe en catálogo (catalogPreview).
  const [previewOnly, setPreviewOnly] = useState(catalogPreview);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");

  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef<string[]>([]);

  const customVariant = useMemo(() => {
    const variants = product.variants ?? [];
    return (
      variants.find((v) => v.sku?.endsWith("-CUSTOM")) ?? variants[0] ?? null
    );
  }, [product.variants]);

  const placements = useMemo(
    () =>
      mode === "repeat" && repeatBase
        ? computeRepeatPlacements(pieceW, pieceH, AREA, MIN_SPACING_CM)
        : [],
    [mode, repeatBase, pieceW, pieceH],
  );

  const markDirty = useCallback(() => setSaved(false), []);

  const ensureDesign = useCallback(async (): Promise<string | null> => {
    if (designId) return designId;
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
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
        toast.error(data?.error ?? "No pudimos iniciar tu planilla.");
        return null;
      }
      setPreviewOnly(false);
      setDesignId(data.designId as string);
      return data.designId as string;
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
      return null;
    }
  }, [designId, productType, product.id, customVariant]);

  /** Valida el archivo y lo carga como imagen local (sin tocar la red). */
  async function loadLocalImage(file: File): Promise<{
    localUrl: string;
    img: HTMLImageElement;
  } | null> {
    const validation = validateDesignFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return null;
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
      return null;
    }
    const dims = validateImageDimensions(img.width, img.height);
    if (!dims.ok) {
      toast.error(dims.error);
      return null;
    }
    return { localUrl: objectUrl, img };
  }

  /**
   * Persiste el archivo en storage privado en SEGUNDO PLANO y aplica el
   * assetId/URL firmada cuando termina. La pieza ya está visible en la
   * planilla desde antes: subir nunca bloquea la previsualización (esa race
   * dejaba el lienzo vacío en producción con redes lentas).
   */
  async function persistAssetInBackground(
    file: File,
    apply: (assetId: string, remoteUrl?: string) => void,
  ) {
    if (catalogPreview) return;
    setUploading(true);
    try {
      const id = await ensureDesign();
      if (!id) return; // previewOnly ya quedó activo si fue por configuración
      const result = await uploadDesignAsset({ file, designProjectId: id });
      if (!result.ok) {
        if (result.configPending) setPreviewOnly(true);
        else toast.error(result.message);
        return;
      }
      setPreviewOnly(false);
      apply(result.assetId, result.signedUrl);
    } catch {
      toast.error("No pudimos subir tu archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleFreeUpload(file: File) {
    if (pieces.length >= MAX_FREE_IMAGES) {
      toast.error("Alcanzaste el máximo de 7 imágenes.");
      return;
    }
    const loaded = await loadLocalImage(file);
    if (!loaded) return;
    const ratio = loaded.img.height / loaded.img.width;
    // La pieza nueva nunca puede nacer más alta que el área imprimible.
    let widthCm = DEFAULT_PIECE_CM;
    let heightCm = Math.round(DEFAULT_PIECE_CM * ratio * 10) / 10;
    if (heightCm > AREA.heightCm) {
      widthCm = Math.max(1, Math.floor((AREA.heightCm / ratio) * 10) / 10);
      heightCm = Math.round(widthCm * ratio * 10) / 10;
    }
    const others: RectCm[] = pieces.map((p) => ({
      xCm: p.xCm,
      yCm: p.yCm,
      widthCm: p.widthCm,
      heightCm: p.heightCm,
    }));
    const slot = findSlot(widthCm, heightCm, others, AREA, MIN_SPACING_CM);
    if (!slot) {
      toast.error(
        "Esta pieza ya no cabe con la separación mínima. Reduce tamaño o elimina otra pieza.",
      );
      return;
    }
    // 1) La pieza aparece en la planilla DE INMEDIATO.
    const localId = nanoid(8);
    setImages((prev) => ({ ...prev, [localId]: loaded.img }));
    setPieces((prev) => [
      ...prev,
      {
        id: localId,
        assetId: "", // se completa cuando el storage confirma
        localUrl: loaded.localUrl,
        remoteUrl: undefined,
        naturalWidth: loaded.img.width,
        naturalHeight: loaded.img.height,
        xCm: slot.xCm,
        yCm: slot.yCm,
        widthCm,
        heightCm,
        rotation: 0,
        fileName: file.name,
      },
    ]);
    setSelectedId(localId);
    markDirty();
    toast.success(
      catalogPreview
        ? "Imagen agregada (modo previsualización)"
        : "Imagen agregada a la planilla",
    );
    // 2) Persistencia en segundo plano.
    void persistAssetInBackground(file, (assetId, remoteUrl) => {
      setPieces((prev) =>
        prev.map((p) => (p.id === localId ? { ...p, assetId, remoteUrl } : p)),
      );
    });
  }

  async function handleRepeatUpload(file: File) {
    const loaded = await loadLocalImage(file);
    if (!loaded) return;
    // 1) La imagen base se aplica DE INMEDIATO (la grilla se llena al momento).
    setRepeatBase({
      assetId: "", // se completa cuando el storage confirma
      localUrl: loaded.localUrl,
      remoteUrl: undefined,
      image: loaded.img,
      naturalWidth: loaded.img.width,
      naturalHeight: loaded.img.height,
    });
    markDirty();
    toast.success(
      catalogPreview
        ? "Imagen lista para repetir (modo previsualización)"
        : "Imagen lista para repetir",
    );
    // 2) Persistencia en segundo plano. Solo se aplica si el cliente no cambió
    //    de imagen mientras subía.
    void persistAssetInBackground(file, (assetId, remoteUrl) => {
      setRepeatBase((prev) =>
        prev && prev.localUrl === loaded.localUrl
          ? { ...prev, assetId, remoteUrl }
          : prev,
      );
    });
  }

  function movePiece(id: string, xCm: number, yCm: number) {
    setPieces((prev) =>
      prev.map((p) => (p.id === id ? { ...p, xCm, yCm } : p)),
    );
    markDirty();
  }

  function deletePiece(id: string) {
    setPieces((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    markDirty();
  }

  function resizePiece(id: string, widthCm: number) {
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const ratio = p.naturalHeight / p.naturalWidth;
        // El alto derivado nunca puede exceder el área imprimible.
        let nextWidth = widthCm;
        let heightCm = Math.round(nextWidth * ratio * 10) / 10;
        if (heightCm > AREA.heightCm) {
          nextWidth = Math.max(1, Math.floor((AREA.heightCm / ratio) * 10) / 10);
          heightCm = Math.round(nextWidth * ratio * 10) / 10;
        }
        const clamped = clampToPrintable(
          { xCm: p.xCm, yCm: p.yCm, widthCm: nextWidth, heightCm },
          AREA,
        );
        return {
          ...p,
          widthCm: nextWidth,
          heightCm,
          xCm: clamped.xCm,
          yCm: clamped.yCm,
        };
      }),
    );
    markDirty();
  }

  function changeShape(next: Shape) {
    setShape(next);
    if (next !== "rectangle") setPieceH(pieceW);
    markDirty();
  }

  function changeSize(w: number, h: number) {
    setPieceW(w);
    setPieceH(shape === "rectangle" ? h : w);
    markDirty();
  }

  function buildDesignJson() {
    if (mode === "free") {
      return {
        version: 1 as const,
        designerType: "sheet" as const,
        sheetType,
        mode: "free" as const,
        unit: "cm" as const,
        page: { format: "letter" as const, widthCm: LETTER_CM.width, heightCm: LETTER_CM.height },
        printableArea: AREA,
        minSpacingCm: MIN_SPACING_CM,
        assets: pieces.map((p) => ({
          assetId: p.assetId,
          url: p.remoteUrl,
          xCm: p.xCm,
          yCm: p.yCm,
          widthCm: p.widthCm,
          heightCm: p.heightCm,
          rotation: p.rotation,
          shape: "custom" as const,
        })),
      };
    }
    return {
      version: 1 as const,
      designerType: "sheet" as const,
      sheetType,
      mode: "repeat" as const,
      unit: "cm" as const,
      page: { format: "letter" as const, widthCm: LETTER_CM.width, heightCm: LETTER_CM.height },
      printableArea: AREA,
      minSpacingCm: MIN_SPACING_CM,
      baseAssetId: repeatBase?.assetId,
      shape,
      pieceSizeCm: { width: pieceW, height: pieceH },
      count: placements.length,
      placements,
    };
  }

  const hasContent = mode === "free" ? pieces.length > 0 : Boolean(repeatBase);

  async function saveDesign(showToast = true): Promise<string | null> {
    if (!hasContent) {
      toast.error("Agrega al menos una imagen para guardar tu planilla.");
      return null;
    }
    // El backend exige assetId válido por pieza/base: si una subida quedó
    // pendiente o falló, avisamos en claro en lugar de un "Datos inválidos".
    const missingAsset =
      mode === "free"
        ? pieces.some((p) => !p.assetId)
        : !repeatBase?.assetId;
    if (missingAsset) {
      toast.error(
        "Una de tus imágenes aún no termina de guardarse. Espera unos segundos o vuelve a subirla.",
      );
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
          designerType: "sheet",
          productType,
          productId: product.id,
          ...(customVariant ? { variantId: customVariant.id } : {}),
          ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
          designJson: buildDesignJson(),
          ...(previewDataUrl ? { previewDataUrl } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos guardar tu planilla.");
        return null;
      }
      setSaved(true);
      if (showToast) toast.success("Planilla guardada correctamente");
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
        toast.error(data?.error ?? "No pudimos agregarla al carrito.");
        return;
      }
      emitCartUpdated();
      toast.success("¡Tu planilla está en el carrito!", {
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

  function triggerUpload() {
    fileInputRef.current?.click();
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="glass-strong relative overflow-hidden rounded-3xl p-3 sm:p-5">
          <SheetCanvas
            mode={mode}
            pageCm={{ width: LETTER_CM.width, height: LETTER_CM.height }}
            printableCm={AREA}
            spacingCm={MIN_SPACING_CM}
            pieces={pieces}
            images={images}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={movePiece}
            onCollision={() =>
              toast.error(
                "Esta pieza ya no cabe con la separación mínima. Reduce tamaño o elimina otra pieza.",
              )
            }
            repeatImage={repeatBase?.image ?? null}
            repeatShape={shape}
            repeatSizeCm={{ width: pieceW, height: pieceH }}
            repeatPlacements={placements}
            onStageReady={(s) => {
              stageRef.current = s;
            }}
          />
        </section>

        <aside className="flex flex-col gap-5">
          <div className="glass rounded-2xl p-5">
            {mode === "free" ? (
              <FreeLayoutSheet
                pieces={pieces}
                selectedId={selectedId}
                uploading={uploading}
                maxImages={MAX_FREE_IMAGES}
                minPieceCm={REPEAT_MIN_CM}
                maxPieceCm={REPEAT_MAX_CM}
                onUploadClick={triggerUpload}
                onSelect={setSelectedId}
                onDelete={deletePiece}
                onResize={resizePiece}
              />
            ) : (
              <RepeatLayoutSheet
                hasImage={Boolean(repeatBase)}
                previewUrl={repeatBase?.localUrl ?? null}
                uploading={uploading}
                shape={shape}
                widthCm={pieceW}
                heightCm={pieceH}
                count={placements.length}
                minCm={REPEAT_MIN_CM}
                maxCm={REPEAT_MAX_CM}
                onUploadClick={triggerUpload}
                onShapeChange={changeShape}
                onSizeChange={changeSize}
              />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (mode === "free") handleFreeUpload(file);
                  else handleRepeatUpload(file);
                }
                e.target.value = "";
              }}
            />
          </div>

          <div className="glass rounded-2xl p-5">
            <label
              htmlFor="sheet-notes"
              className="mb-1.5 block text-sm font-medium text-ml-white/70"
            >
              Notas para el laboratorio (opcional)
            </label>
            <textarea
              id="sheet-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              placeholder="Cuéntanos cualquier detalle de tu planilla…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
            />
          </div>

          <DesignerCTA
            canSave={hasContent && !uploading && !previewOnly}
            canAddToCart={hasContent && !uploading && !previewOnly}
            saving={saving}
            addingToCart={addingToCart}
            saved={saved}
            designId={designId}
            onSave={() => saveDesign(true)}
            onAddToCart={handleAddToCart}
            note={
              previewOnly
                ? catalogPreview
                  ? "Para guardar o agregar al carrito necesitamos activar este producto en catálogo. Puedes cotizar por WhatsApp."
                  : "Estás en modo previsualización: puedes armar tu planilla. Para guardar o agregar al carrito, termina de configurar el almacenamiento o escríbenos por WhatsApp."
                : undefined
            }
          />
        </aside>
      </div>

      <SheetDisclaimer />
    </>
  );
}

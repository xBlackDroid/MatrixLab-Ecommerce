"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Eye, Loader2, SlidersHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import type Konva from "konva";
import { nanoid } from "nanoid";
import { emitCartUpdated } from "@/components/store/CartBadge";
import AssetLayerPanel from "@/components/designer/AssetLayerPanel";
import ColorSwatchGrid from "@/components/designer/ColorSwatchGrid";
import DesignerCTA from "@/components/designer/DesignerCTA";
import GarmentDisclaimer from "@/components/designer/GarmentDisclaimer";
import PrintSizeHelper from "@/components/designer/PrintSizeHelper";
import PrintZoneSelector from "@/components/designer/PrintZoneSelector";
import ProductSpinViewer from "@/components/designer/ProductSpinViewer";
import type { AssetTransform } from "@/components/designer/MultiAssetCanvas";
import {
  getColorById,
  getColorsForProduct,
  getDefaultColor,
  type ProductColor,
} from "@/lib/designer/color-palettes";
import { exportStagePreview } from "@/lib/designer/exportPreview";
import { isWithinSafeArea } from "@/lib/designer/printAreas";
import { getPrintAreaCm, PROFILE_LABELS, type GarmentSize } from "@/lib/designer/print-sizes";
import { getCatalogEntry } from "@/lib/designer/product-catalog";
import { getGarmentView, getFrames } from "@/lib/designer/product-views";
import {
  validateDesignFile,
  validateImageDimensions,
} from "@/lib/designer/validation";
import { uploadDesignAsset } from "@/lib/uploads/uploadDesignAsset";
import type { PlacedAsset } from "@/lib/designer/types";
import type {
  DesignerProductType,
  GarmentProfile,
  ProductWithVariants,
} from "@/lib/db/types";
import { cn } from "@/lib/utils";

const MultiAssetCanvas = dynamic(
  () => import("@/components/designer/MultiAssetCanvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[5/6] w-full items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
      </div>
    ),
  },
);

const MAX_BY_SIDE: Record<"front" | "back", number> = { front: 1, back: 2 };
const PROFILES: GarmentProfile[] = ["nino", "mujer", "hombre"];
const SIZES: GarmentSize[] = ["CH", "M", "G", "EG"];

interface GarmentDesignerProps {
  productType: DesignerProductType;
  product: ProductWithVariants;
}

type SideAssets = { front: PlacedAsset[]; back: PlacedAsset[] };

export default function GarmentDesigner({
  productType,
  product,
}: GarmentDesignerProps) {
  const entry = getCatalogEntry(productType);
  const view = getGarmentView(productType);
  const colors = useMemo(() => getColorsForProduct(productType), [productType]);

  const [color, setColor] = useState<ProductColor>(
    () => getDefaultColor(productType),
  );
  const [profile, setProfile] = useState<GarmentProfile>("hombre");
  const [size, setSize] = useState<GarmentSize>("M");
  const [side, setSide] = useState<"front" | "back">("front");
  const zone = view.zones.find((z) => z.id === side) ?? view.zones[0]!;

  const [assets, setAssets] = useState<SideAssets>({ front: [], back: [] });
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [designId, setDesignId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // true cuando el backend (storage/diseños) aún no está configurado: el editor
  // sigue usable en modo previsualización, pero guardar/agregar al carrito se
  // deshabilita con un aviso claro (en vez de un toast de "en configuración").
  const [previewOnly, setPreviewOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spinOpen, setSpinOpen] = useState(false);
  const [previews, setPreviews] = useState<{ front: string | null; back: string | null }>(
    { front: null, back: null },
  );

  const stageRef = useRef<Konva.Stage | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef<string[]>([]);

  const currentAssets = assets[side];
  const areaCm = getPrintAreaCm({
    productType,
    usesProfileSize: entry.usesProfileSize,
    profile,
    size,
    zone: side,
  });
  const cmPerPxX = areaCm.width / zone.safeArea.width;
  const cmPerPxY = areaCm.height / zone.safeArea.height;

  const customVariant = useMemo(() => {
    const variants = product.variants ?? [];
    return (
      variants.find(
        (v) => v.sku?.endsWith("-CUSTOM") || v.option_label === "Personalizado",
      ) ??
      variants[0] ??
      null
    );
  }, [product.variants]);

  function assetWithinBounds(asset: PlacedAsset): boolean {
    return isWithinSafeArea({
      safeArea: zone.safeArea,
      centerX: asset.x,
      centerY: asset.y,
      drawWidth: asset.naturalWidth * asset.scale,
      drawHeight: asset.naturalHeight * asset.scale,
      rotationDeg: asset.rotation,
    });
  }
  const sideWithinBounds = currentAssets.every(assetWithinBounds);
  const selectedAsset = currentAssets.find((a) => a.id === selectedId) ?? null;
  const selectedCm = selectedAsset
    ? {
        width: selectedAsset.naturalWidth * selectedAsset.scale * cmPerPxX,
        height: selectedAsset.naturalHeight * selectedAsset.scale * cmPerPxY,
      }
    : null;

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
        // Storage/diseños sin configurar: modo previsualización, sin alarmar.
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
  }, [designId, productType, product.id, customVariant]);

  function centeredTransform(img: HTMLImageElement) {
    const fit =
      Math.min(
        (zone.safeArea.width * 0.7) / img.width,
        (zone.safeArea.height * 0.7) / img.height,
      ) || 0.5;
    return {
      x: zone.safeArea.x + zone.safeArea.width / 2,
      y: zone.safeArea.y + zone.safeArea.height / 2,
      scale: Math.max(0.05, Math.min(fit, 12)),
      rotation: 0,
    };
  }

  async function handleFile(file: File) {
    if (currentAssets.length >= MAX_BY_SIDE[side]) {
      toast.error(
        side === "front"
          ? "El frente admite máximo 1 imagen."
          : "La espalda admite máximo 2 imágenes.",
      );
      return;
    }
    const validation = validateDesignFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrls.current.push(objectUrl);
    const img = new window.Image();
    img.onload = async () => {
      const dims = validateImageDimensions(img.width, img.height);
      if (!dims.ok) {
        toast.error(dims.error);
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // 1) Coloca la imagen en el lienzo de inmediato: diseñar y probar NUNCA se
      //    bloquea, aunque el storage todavía no esté configurado.
      const localId = nanoid(8);
      const t = centeredTransform(img);
      const placed: PlacedAsset = {
        id: localId,
        assetId: "", // se completa cuando se persiste en storage
        localUrl: objectUrl,
        remoteUrl: undefined,
        naturalWidth: img.width,
        naturalHeight: img.height,
        x: t.x,
        y: t.y,
        scale: t.scale,
        rotation: 0,
        fileName: file.name,
      };
      setImages((prev) => ({ ...prev, [localId]: img }));
      setAssets((prev) => ({ ...prev, [side]: [...prev[side], placed] }));
      setSelectedId(localId);
      markDirty();

      // 2) Persiste en segundo plano al storage privado. Si falta configuración,
      //    pasa a modo previsualización sin mostrar un error alarmante.
      setUploading(true);
      try {
        const id = await ensureDesign();
        if (!id) return; // previewOnly ya quedó activo si fue por configuración
        const result = await uploadDesignAsset({ file, designProjectId: id });
        if (!result.ok) {
          if (result.configPending) {
            setPreviewOnly(true);
          } else {
            toast.error(result.message);
          }
          return;
        }
        setPreviewOnly(false);
        setAssets((prev) => ({
          ...prev,
          [side]: prev[side].map((a) =>
            a.id === localId
              ? {
                  ...a,
                  assetId: result.assetId,
                  remoteUrl: result.signedUrl,
                  fileName: result.fileName,
                }
              : a,
          ),
        }));
        toast.success("Imagen agregada");
      } catch {
        toast.error("No pudimos subir tu archivo. Intenta de nuevo.");
      } finally {
        setUploading(false);
      }
    };
    img.onerror = () => {
      toast.error("No pudimos leer la imagen.");
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  function updateAsset(id: string, transform: AssetTransform) {
    setAssets((prev) => ({
      ...prev,
      [side]: prev[side].map((a) => (a.id === id ? { ...a, ...transform } : a)),
    }));
    markDirty();
  }

  function deleteAsset(id: string) {
    setAssets((prev) => ({
      ...prev,
      [side]: prev[side].filter((a) => a.id !== id),
    }));
    if (selectedId === id) setSelectedId(null);
    markDirty();
  }

  function centerAsset(id: string) {
    setAssets((prev) => ({
      ...prev,
      [side]: prev[side].map((a) =>
        a.id === id
          ? { ...a, x: zone.safeArea.x + zone.safeArea.width / 2, y: zone.safeArea.y + zone.safeArea.height / 2 }
          : a,
      ),
    }));
    markDirty();
  }

  function duplicateAsset(id: string) {
    if (currentAssets.length >= MAX_BY_SIDE[side]) {
      toast.error("Alcanzaste el máximo de imágenes en esta zona.");
      return;
    }
    const original = currentAssets.find((a) => a.id === id);
    const img = images[id];
    if (!original || !img) return;
    const newId = nanoid(8);
    setImages((prev) => ({ ...prev, [newId]: img }));
    setAssets((prev) => ({
      ...prev,
      [side]: [
        ...prev[side],
        { ...original, id: newId, x: original.x + 24, y: original.y + 24 },
      ],
    }));
    setSelectedId(newId);
    markDirty();
  }

  function buildDesignJson() {
    const buildView = (s: "front" | "back") => {
      const z = view.zones.find((zz) => zz.id === s);
      const cm = getPrintAreaCm({
        productType,
        usesProfileSize: entry.usesProfileSize,
        profile,
        size,
        zone: s,
      });
      const px = z?.safeArea ?? zone.safeArea;
      const fx = cm.width / px.width;
      const fy = cm.height / px.height;
      return {
        printAreaCm: { width: cm.width, height: cm.height },
        assets: assets[s].map((a) => ({
          assetId: a.assetId,
          url: a.remoteUrl,
          x: a.x,
          y: a.y,
          scale: a.scale,
          rotation: a.rotation,
          widthCm: Math.round(a.naturalWidth * a.scale * fx * 10) / 10,
          heightCm: Math.round(a.naturalHeight * a.scale * fy * 10) / 10,
          withinSafeArea: isWithinSafeArea({
            safeArea: px,
            centerX: a.x,
            centerY: a.y,
            drawWidth: a.naturalWidth * a.scale,
            drawHeight: a.naturalHeight * a.scale,
            rotationDeg: a.rotation,
          }),
        })),
      };
    };
    return {
      version: 2 as const,
      designerType: "garment" as const,
      productType,
      profile,
      size,
      colorId: color.id,
      stage: view.stage,
      views: { front: buildView("front"), back: buildView("back") },
    };
  }

  /** Cambia al lado pedido, espera dos frames y exporta la preview del lienzo. */
  async function captureSidePreview(
    target: "front" | "back",
  ): Promise<string | null> {
    if (side !== target) {
      setSelectedId(null);
      setSide(target);
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
    }
    return stageRef.current ? exportStagePreview(stageRef.current) : null;
  }

  const captureFrontPreview = () => captureSidePreview("front");

  /**
   * Genera previews locales de frente y espalda con el diseño aplicado, a
   * partir del estado actual del lienzo (NO depende de nada persistido). Se usa
   * al abrir la vista de giro para que nunca aparezca vacía después de guardar.
   */
  async function prepareSpinPreviews() {
    const original = side;
    let front = previews.front;
    let back = previews.back;
    if (assets.front.length > 0) front = await captureSidePreview("front");
    if (assets.back.length > 0) back = await captureSidePreview("back");
    if (side !== original) {
      setSide(original);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    }
    setPreviews({ front, back });
  }

  async function toggleSpin() {
    const opening = !spinOpen;
    setSpinOpen(opening);
    if (opening) await prepareSpinPreviews();
  }

  async function saveDesign(showToast = true): Promise<string | null> {
    if (assets.front.length === 0 && assets.back.length === 0) {
      toast.error("Sube al menos una imagen para guardar tu diseño.");
      return null;
    }
    // El backend exige un assetId válido por imagen: si una subida quedó
    // pendiente o falló, avisamos en claro en lugar de un "Datos inválidos".
    if ([...assets.front, ...assets.back].some((a) => !a.assetId)) {
      toast.error(
        "Una de tus imágenes aún no termina de guardarse. Espera unos segundos o vuelve a subirla.",
      );
      return null;
    }
    const id = await ensureDesign();
    if (!id) return null;
    setSaving(true);
    try {
      const previewDataUrl = await captureFrontPreview();
      if (previewDataUrl) setPreviews((p) => ({ ...p, front: previewDataUrl }));
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designerType: "garment",
          productType,
          productId: product.id,
          ...(customVariant ? { variantId: customVariant.id } : {}),
          colorId: color.id,
          profile,
          size,
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

  const productSelector = (
    <div className="flex flex-col gap-6">
      {entry.usesProfileSize && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Perfil</p>
          <div className="grid grid-cols-3 gap-2">
            {PROFILES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setProfile(p);
                  markDirty();
                }}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-xs font-medium transition",
                  profile === p
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/10 bg-white/5 text-ml-white/70 hover:border-white/25",
                )}
              >
                {PROFILE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.usesProfileSize && (
        <div>
          <p className="mb-2 text-sm font-medium text-ml-white/70">Talla</p>
          <div className="flex flex-wrap gap-2">
            {SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  markDirty();
                }}
                className={cn(
                  "min-w-12 rounded-full border px-3 py-2 text-sm transition",
                  size === s
                    ? "border-ml-cyan bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/15 bg-white/5 text-ml-white/75 hover:border-white/30",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ml-white/70">Color base</p>
        <ColorSwatchGrid
          colors={colors}
          selectedId={color.id}
          onSelect={(c) => {
            setColor(getColorById(productType, c.id) ?? c);
            markDirty();
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* Panel izquierdo (desktop) */}
        <aside className="glass hidden h-fit rounded-2xl p-5 lg:block">
          {productSelector}
        </aside>

        {/* Centro: lienzo */}
        <section className="glass-strong relative overflow-hidden rounded-3xl p-3 sm:p-5">
          <MultiAssetCanvas
            stage={view.stage}
            mockupKey={view.mockupKey}
            colorId={color.id}
            profile={profile}
            color={{ hex: color.hex ?? "#f1f2f4", shadowHex: color.shadowHex }}
            side={side}
            safeArea={zone.safeArea}
            assets={currentAssets}
            images={images}
            selectedId={selectedId}
            withinBounds={sideWithinBounds}
            onSelect={setSelectedId}
            onChange={updateAsset}
            onStageReady={(s) => {
              stageRef.current = s;
            }}
          />

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:hidden">
            <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
              <Drawer.Trigger asChild>
                <button
                  type="button"
                  className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                >
                  <SlidersHorizontal className="h-4 w-4 text-ml-cyan" aria-hidden />
                  Perfil, talla y color
                </button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
                <Drawer.Content className="glass-strong fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl p-6 pb-10">
                  <Drawer.Title className="sr-only">Opciones del producto</Drawer.Title>
                  <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
                  {productSelector}
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
            <button
              type="button"
              onClick={toggleSpin}
              className="glass inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <Eye className="h-4 w-4 text-ml-violet" aria-hidden />
              Vista de giro
            </button>
          </div>

          {spinOpen && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ProductSpinViewer
                productType={productType}
                colorId={color.id}
                viewType={view.viewType}
                views={{
                  frames: getFrames(view, color.id),
                  front: previews.front,
                  back: previews.back,
                }}
              />
              <p className="mt-2 text-center text-xs text-ml-white/45">
                Vista de referencia generada desde tu diseño. Arrastra para girar
                entre frente y espalda.
              </p>
            </div>
          )}
        </section>

        {/* Panel derecho: herramientas */}
        <aside className="flex flex-col gap-5">
          <div className="glass rounded-2xl p-5">
            <PrintZoneSelector
              zones={view.zones}
              activeZone={side}
              onChange={(z) => {
                setSide(z);
                setSelectedId(null);
              }}
              counts={{ front: assets.front.length, back: assets.back.length }}
            />
            <p className="mt-3 mb-2 text-sm font-medium text-ml-white/70">
              Tu diseño{" "}
              <span className="text-ml-white/45">
                ({currentAssets.length}/{MAX_BY_SIDE[side]})
              </span>
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || currentAssets.length >= MAX_BY_SIDE[side]}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/5 px-4 py-6 text-center transition hover:border-ml-violet/50 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="h-7 w-7 animate-spin text-ml-violet" aria-hidden />
              ) : (
                <Upload className="h-7 w-7 text-ml-violet" aria-hidden />
              )}
              <span className="text-sm font-semibold">Subir imagen</span>
              <span className="text-xs text-ml-white/50">
                PNG, JPG o WEBP · recomendado PNG sin fondo
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <div className="mt-4">
              <AssetLayerPanel
                assets={currentAssets}
                selectedId={selectedId}
                maxAssets={MAX_BY_SIDE[side]}
                onSelect={setSelectedId}
                onCenter={centerAsset}
                onDuplicate={duplicateAsset}
                onDelete={deleteAsset}
              />
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <PrintSizeHelper
              areaCm={areaCm}
              selectedCm={selectedCm}
              withinBounds={sideWithinBounds}
            />
            <label
              htmlFor="garment-notes"
              className="mt-4 mb-1.5 block text-sm font-medium text-ml-white/70"
            >
              Notas para el laboratorio (opcional)
            </label>
            <textarea
              id="garment-notes"
              rows={3}
              maxLength={500}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              placeholder="Ej. quiero el diseño un poco más arriba…"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
            />
            <button
              type="button"
              onClick={toggleSpin}
              className="mt-3 hidden w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ml-white/80 transition hover:border-ml-violet/50 lg:inline-flex"
            >
              <Eye className="h-4 w-4 text-ml-violet" aria-hidden />
              {spinOpen ? "Ocultar" : "Ver"} vista de giro
            </button>
          </div>

          <DesignerCTA
            canSave={
              (assets.front.length > 0 || assets.back.length > 0) &&
              !uploading &&
              !previewOnly
            }
            canAddToCart={
              (assets.front.length > 0 || assets.back.length > 0) &&
              !uploading &&
              !previewOnly
            }
            saving={saving}
            addingToCart={addingToCart}
            saved={saved}
            designId={designId}
            onSave={() => saveDesign(true)}
            onAddToCart={handleAddToCart}
            note={
              previewOnly
                ? "Estás en modo previsualización: puedes diseñar y acomodar tu imagen. Para guardar o agregar al carrito, termina de configurar el almacenamiento o escríbenos por WhatsApp."
                : undefined
            }
          />
        </aside>
      </div>

      <GarmentDisclaimer />
    </>
  );
}

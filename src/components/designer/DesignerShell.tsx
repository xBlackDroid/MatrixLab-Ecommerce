"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import type Konva from "konva";
import { emitCartUpdated } from "@/components/store/CartBadge";
import DesignerCTA from "@/components/designer/DesignerCTA";
import DesignerSummary from "@/components/designer/DesignerSummary";
import DesignToolbar from "@/components/designer/DesignToolbar";
import ProductSelector from "@/components/designer/ProductSelector";
import UploadPanel from "@/components/designer/UploadPanel";
import { exportStagePreview } from "@/lib/designer/exportPreview";
import {
  getProductTypeConfig,
  getZoneConfig,
  isWithinSafeArea,
} from "@/lib/designer/printAreas";
import type {
  BaseColorOption,
  DesignJsonV1,
  DesignTransform,
} from "@/lib/designer/types";
import type {
  PrintZone,
  ProductTypeId,
  ProductWithVariants,
} from "@/lib/db/types";
import {
  validateDesignFile,
  validateImageDimensions,
} from "@/lib/designer/validation";

// Konva SOLO se carga en las rutas del diseñador (nunca en landing/tienda).
const ProductMockupStage = dynamic(
  () => import("@/components/designer/ProductMockupStage"),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[5/6] w-full items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
      </div>
    ),
  },
);

interface DesignerShellProps {
  productType: ProductTypeId;
  product: ProductWithVariants;
}

export default function DesignerShell({
  productType,
  product,
}: DesignerShellProps) {
  const config = getProductTypeConfig(productType);

  const [baseColor, setBaseColor] = useState<BaseColorOption>(
    config.baseColors[0]!,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    config.sizeRequired ? (config.sizes[1] ?? config.sizes[0] ?? null) : null,
  );
  const [zoneId, setZoneId] = useState<PrintZone>(config.defaultZone);
  const zone = getZoneConfig(config, zoneId);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [transform, setTransform] = useState<DesignTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  });

  const [designId, setDesignId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedOk, setUploadedOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stageRef = useRef<Konva.Stage | null>(null);

  // Variante real según color/talla elegidos (para precio y carrito).
  const selectedVariant = useMemo(() => {
    const variants = product.variants;
    if (variants.length === 0) return null;
    return (
      variants.find(
        (variant) =>
          (variant.color ?? "") === baseColor.label &&
          (!config.sizeRequired || (variant.size ?? "") === (selectedSize ?? "")),
      ) ?? null
    );
  }, [product.variants, baseColor.label, config.sizeRequired, selectedSize]);

  const unitPrice =
    selectedVariant?.price !== null && selectedVariant?.price !== undefined
      ? Number(selectedVariant.price)
      : Number(product.base_price);

  const withinBounds = useMemo(() => {
    if (!image) return true;
    return isWithinSafeArea({
      safeArea: zone.safeArea,
      centerX: transform.x,
      centerY: transform.y,
      drawWidth: image.width * transform.scale,
      drawHeight: image.height * transform.scale,
      rotationDeg: transform.rotation,
    });
  }, [image, transform, zone.safeArea]);

  const markDirty = useCallback(() => setSaved(false), []);

  function centerTransform(img: HTMLImageElement): DesignTransform {
    const fitScale =
      Math.min(
        zone.safeArea.width / img.width,
        zone.safeArea.height / img.height,
      ) * 0.85;
    return {
      x: zone.safeArea.x + zone.safeArea.width / 2,
      y: zone.safeArea.y + zone.safeArea.height / 2,
      scale: Math.max(0.1, Math.min(fitScale, 5)),
      rotation: 0,
    };
  }

  const ensureDesign = useCallback(async (): Promise<string | null> => {
    if (designId) return designId;
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          productId: product.id,
          ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.designId) {
        toast.error(data?.error ?? "No pudimos iniciar tu diseño.");
        return null;
      }
      setDesignId(data.designId as string);
      return data.designId as string;
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
      return null;
    }
  }, [designId, productType, product.id, selectedVariant]);

  async function handleFileSelected(file: File) {
    const validation = validateDesignFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    // Carga local inmediata (object URL: el canvas no se "ensucia").
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = async () => {
      const dims = validateImageDimensions(img.width, img.height);
      if (!dims.ok) {
        toast.error(dims.error);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setImage(img);
      setFileName(file.name);
      setTransform(centerTransform(img));
      setUploadedOk(false);
      markDirty();

      // Subida al storage privado en paralelo.
      setUploading(true);
      try {
        const id = await ensureDesign();
        if (!id) return;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("designProjectId", id);
        const res = await fetch("/api/uploads/design-assets", {
          method: "POST",
          body: formData,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          toast.error(
            data?.error ??
              "No pudimos subir tu archivo. Tu diseño no se guardará hasta reintentar.",
          );
          return;
        }
        setUploadedOk(true);
        toast.success("Diseño cargado en el laboratorio");
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

  const buildDesignJson = useCallback((): DesignJsonV1 => {
    return {
      version: 1,
      productType,
      zone: zoneId,
      transform,
      stage: config.stage,
      asset: image ? { width: image.width, height: image.height } : null,
      baseColor: baseColor.label,
      withinSafeArea: withinBounds,
    };
  }, [productType, zoneId, transform, config.stage, image, baseColor.label, withinBounds]);

  async function saveDesign(showToast = true): Promise<string | null> {
    if (!image || !uploadedOk) {
      toast.error("Primero sube tu imagen.");
      return null;
    }
    if (!withinBounds) {
      toast.error("Tu diseño se sale del área imprimible. Ajústalo primero.");
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
          productType,
          productId: product.id,
          ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
          baseColor: baseColor.label,
          ...(selectedSize ? { selectedSize } : {}),
          printZone: zoneId,
          positionX: transform.x,
          positionY: transform.y,
          scale: transform.scale,
          rotation: transform.rotation,
          ...(notes.trim() ? { customerNotes: notes.trim() } : {}),
          designJson: buildDesignJson() as unknown as Record<string, unknown>,
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
    if (config.sizeRequired && !selectedSize) {
      toast.error("Elige una talla.");
      return;
    }
    if (product.variants.length > 0 && !selectedVariant) {
      toast.error(
        "Esa combinación no está disponible por ahora. Prueba otro color o talla.",
      );
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
          ...(selectedVariant ? { variantId: selectedVariant.id } : {}),
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

  const handleTransformChange = useCallback(
    (next: DesignTransform) => {
      setTransform(next);
      markDirty();
    },
    [markDirty],
  );

  const selectorPanel = (
    <ProductSelector
      config={config}
      baseColor={baseColor}
      selectedSize={selectedSize}
      onColorChange={(color) => {
        setBaseColor(color);
        markDirty();
      }}
      onSizeChange={(size) => {
        setSelectedSize(size);
        markDirty();
      }}
    />
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
      {/* Panel izquierdo (desktop) */}
      <aside className="glass hidden h-fit rounded-2xl p-5 lg:block">
        {selectorPanel}
      </aside>

      {/* Centro: mockup */}
      <section className="glass-strong relative overflow-hidden rounded-3xl p-3 sm:p-5">
        <ProductMockupStage
          config={config}
          baseColor={baseColor}
          zone={zone}
          image={image}
          transform={transform}
          withinBounds={withinBounds}
          onTransformChange={handleTransformChange}
          onStageReady={(stage) => {
            stageRef.current = stage;
          }}
        />

        {/* Acceso móvil al panel de producto */}
        <div className="mt-3 lg:hidden">
          <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Drawer.Trigger asChild>
              <button
                type="button"
                className="glass flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
              >
                <SlidersHorizontal className="h-4 w-4 text-ml-cyan" aria-hidden />
                Producto, color y talla
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="glass-strong fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-6 pb-10">
                <Drawer.Title className="sr-only">
                  Opciones del producto
                </Drawer.Title>
                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />
                {selectorPanel}
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </section>

      {/* Panel derecho: herramientas + resumen + acciones */}
      <aside className="flex flex-col gap-5">
        <div className="glass rounded-2xl p-5">
          <UploadPanel
            hasImage={Boolean(image)}
            uploading={uploading}
            uploadedOk={uploadedOk}
            fileName={fileName}
            onFileSelected={handleFileSelected}
          />
        </div>

        <div className="glass rounded-2xl p-5">
          <DesignToolbar
            config={config}
            zoneId={zoneId}
            scale={transform.scale}
            rotation={transform.rotation}
            hasImage={Boolean(image)}
            onZoneChange={(nextZone) => {
              setZoneId(nextZone);
              markDirty();
            }}
            onScaleChange={(scale) => {
              setTransform((current) => ({ ...current, scale }));
              markDirty();
            }}
            onRotationChange={(rotation) => {
              setTransform((current) => ({ ...current, rotation }));
              markDirty();
            }}
            onCenter={() => {
              if (!image) return;
              setTransform((current) => ({
                ...current,
                x: zone.safeArea.x + zone.safeArea.width / 2,
                y: zone.safeArea.y + zone.safeArea.height / 2,
              }));
              markDirty();
            }}
            onReset={() => {
              if (!image) return;
              setTransform(centerTransform(image));
              markDirty();
            }}
            onRemoveImage={() => {
              setImage(null);
              setFileName(null);
              setUploadedOk(false);
              markDirty();
            }}
          />
        </div>

        <div className="glass rounded-2xl p-5">
          <DesignerSummary
            config={config}
            colorLabel={baseColor.label}
            selectedSize={selectedSize}
            zoneLabel={zone.label}
            unitPrice={Number.isFinite(unitPrice) ? unitPrice : null}
            hasImage={Boolean(image)}
            withinBounds={withinBounds}
            notes={notes}
            onNotesChange={(value) => {
              setNotes(value);
              markDirty();
            }}
          />
        </div>

        <DesignerCTA
          canSave={Boolean(image) && uploadedOk && !uploading}
          canAddToCart={
            Boolean(image) && uploadedOk && !uploading && withinBounds
          }
          saving={saving}
          addingToCart={addingToCart}
          saved={saved}
          designId={designId}
          onSave={() => saveDesign(true)}
          onAddToCart={handleAddToCart}
        />
      </aside>
    </div>
  );
}

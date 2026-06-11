"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import StatusBadge from "@/components/admin/StatusBadge";
import type {
  CategoryRow,
  ProductRow,
  ProductVariantRow,
} from "@/lib/db/types";
import { toHandle } from "@/lib/security/sanitize";
import { cn } from "@/lib/utils";
import {
  PRODUCT_STATUSES,
  VARIANT_STATUSES,
} from "@/lib/validation/store";

const CSRF_HEADER = "x-ml-csrf";

const isMoney = (value: string) =>
  value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
const isIntInRange = (value: string, min: number, max: number) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max;
};

/**
 * Formulario cliente (espejo de AdminProductSchema; el servidor re-valida).
 * Los numéricos viajan como string en el form y se convierten al enviar.
 */
const ProductFormSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres").max(120),
  handle: z
    .string()
    .min(1, "Requerido")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  categoryId: z.string().min(1, "Elige una categoría"),
  description: z.string().max(5000).optional(),
  basePrice: z.string().refine(isMoney, "Precio inválido"),
  compareAtPrice: z
    .string()
    .refine((value) => value.trim() === "" || isMoney(value), "Precio inválido"),
  status: z.enum(PRODUCT_STATUSES),
  isCustomizable: z.boolean(),
  productionTime: z.string().max(80).optional(),
  minQuantity: z
    .string()
    .refine((value) => isIntInRange(value, 1, 999), "Entre 1 y 999"),
  maxQuantity: z
    .string()
    .refine((value) => isIntInRange(value, 1, 999), "Entre 1 y 999"),
  tagsText: z.string().max(500).optional(),
});

type ProductFormValues = z.infer<typeof ProductFormSchema>;

export type ProductWithRelations = ProductRow & {
  product_variants: ProductVariantRow[] | null;
  categories: Pick<CategoryRow, "id" | "title" | "handle"> | null;
};

interface ProductEditorProps {
  product: ProductWithRelations | null;
  categories: CategoryRow[];
  csrf: string;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet";

export default function ProductEditor({
  product,
  categories,
  csrf,
  onClose,
  onSaved,
}: ProductEditorProps) {
  const isEdit = product !== null;
  const [images, setImages] = useState<string[]>(
    Array.isArray(product?.images) ? product.images : [],
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      title: product?.title ?? "",
      handle: product?.handle ?? "",
      categoryId: product?.category_id ?? categories[0]?.id ?? "",
      description: product?.description ?? "",
      basePrice: product ? String(product.base_price) : "0",
      compareAtPrice: product?.compare_at_price
        ? String(product.compare_at_price)
        : "",
      status: product?.status ?? "oculto",
      isCustomizable: product?.is_customizable ?? false,
      productionTime: product?.production_time ?? "",
      minQuantity: String(product?.min_quantity ?? 1),
      maxQuantity: String(product?.max_quantity ?? 999),
      tagsText: product?.tags?.join(", ") ?? "",
    },
  });

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { [CSRF_HEADER]: csrf },
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        toast.error(data?.error ?? "No pudimos subir la imagen.");
        return;
      }
      setImages((current) => [...current, data.url as string].slice(0, 8));
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(values: ProductFormValues) {
    const minQuantity = Number(values.minQuantity);
    const maxQuantity = Number(values.maxQuantity);
    if (maxQuantity < minQuantity) {
      toast.error("La cantidad máxima debe ser mayor o igual a la mínima.");
      return;
    }
    setSubmitting(true);
    try {
      const payloadBase = {
        title: values.title,
        handle: values.handle,
        description: values.description ?? "",
        categoryId: values.categoryId,
        basePrice: Number(values.basePrice),
        compareAtPrice:
          values.compareAtPrice.trim() === ""
            ? null
            : Number(values.compareAtPrice),
        images,
        status: values.status,
        isCustomizable: values.isCustomizable,
        productionTime: values.productionTime ?? "",
        minQuantity,
        maxQuantity,
        tags: (values.tagsText ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12),
      };

      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER]: csrf,
        },
        body: JSON.stringify(
          isEdit ? { id: product.id, ...payloadBase } : payloadBase,
        ),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos guardar el producto.");
        return;
      }
      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      onSaved();
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
      <div className="glass-strong w-full max-w-2xl rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full border border-white/10 p-2 text-ml-white/60 transition hover:text-ml-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Título *
              </label>
              <input
                type="text"
                className={inputClass}
                {...register("title", {
                  onChange: (event) => {
                    if (!isEdit) {
                      setValue("handle", toHandle(event.target.value));
                    }
                  },
                })}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-ml-coral">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Handle (URL) *
              </label>
              <input type="text" className={inputClass} {...register("handle")} />
              {errors.handle && (
                <p className="mt-1 text-xs text-ml-coral">{errors.handle.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Categoría *
              </label>
              <select className={inputClass} {...register("categoryId")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id} className="bg-ml-bg">
                    {category.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Precio base (MXN) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputClass}
                {...register("basePrice")}
              />
              {errors.basePrice && (
                <p className="mt-1 text-xs text-ml-coral">
                  {errors.basePrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Precio de comparación
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Opcional"
                className={inputClass}
                {...register("compareAtPrice")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Estado *
              </label>
              <select className={inputClass} {...register("status")}>
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status} className="bg-ml-bg">
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Tiempo de producción
              </label>
              <input
                type="text"
                placeholder="Ej. 3 a 5 días hábiles"
                className={inputClass}
                {...register("productionTime")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Cantidad mínima
              </label>
              <input
                type="number"
                min="1"
                max="999"
                className={inputClass}
                {...register("minQuantity")}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Cantidad máxima
              </label>
              <input
                type="number"
                min="1"
                max="999"
                className={inputClass}
                {...register("maxQuantity")}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Descripción
              </label>
              <textarea rows={4} className={inputClass} {...register("description")} />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm text-ml-white/70">
                Tags (separados por coma)
              </label>
              <input
                type="text"
                placeholder="personalizable, eventos"
                className={inputClass}
                {...register("tagsText")}
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm sm:col-span-2">
              <input
                type="checkbox"
                className="h-4.5 w-4.5 accent-ml-violet"
                {...register("isCustomizable")}
              />
              Personalizable en el laboratorio (muestra CTA de diseño)
            </label>
          </div>

          {/* Imágenes */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-sm font-medium text-ml-white/70">
              Imágenes ({images.length}/8)
            </p>
            {images.length > 0 && (
              <ul className="mb-3 flex flex-col gap-1.5">
                {images.map((url) => (
                  <li
                    key={url}
                    className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate text-ml-white/65">{url}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setImages((current) => current.filter((u) => u !== url))
                      }
                      aria-label="Quitar imagen"
                      className="text-ml-white/40 hover:text-ml-coral"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={imageUrlInput}
                onChange={(event) => setImageUrlInput(event.target.value)}
                placeholder="https://… (pegar URL)"
                className={cn(inputClass, "flex-1")}
              />
              <button
                type="button"
                onClick={() => {
                  const url = imageUrlInput.trim();
                  if (!url) return;
                  try {
                    new URL(url);
                  } catch {
                    toast.error("URL inválida.");
                    return;
                  }
                  setImages((current) => [...current, url].slice(0, 8));
                  setImageUrlInput("");
                }}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm transition hover:border-ml-violet/50"
              >
                Agregar URL
              </button>
              <label className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm transition hover:border-ml-cyan/50">
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden />
                )}
                Subir
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) uploadImage(file);
                    event.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {isEdit && (
            <VariantManager product={product} csrf={csrf} onChanged={onSaved} />
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold transition hover:border-white/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-full bg-ml-violet px-6 py-3 text-sm font-semibold text-ml-bg transition hover:bg-ml-violet/90 disabled:opacity-50"
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              {isEdit ? "Guardar cambios" : "Crear producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Variantes del producto: listado + alta rápida + borrar. */
function VariantManager({
  product,
  csrf,
  onChanged,
}: {
  product: ProductWithRelations;
  csrf: string;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [status, setStatus] =
    useState<(typeof VARIANT_STATUSES)[number]>("disponible");
  const [busy, setBusy] = useState(false);

  const variants = product.product_variants ?? [];

  async function addVariant() {
    if (!title.trim()) {
      toast.error("La variante necesita un título.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify({
          productId: product.id,
          title: title.trim(),
          ...(sku.trim() ? { sku: sku.trim() } : {}),
          ...(price.trim() ? { price: Number(price) } : {}),
          stock: Number(stock) || 0,
          ...(color.trim() ? { color: color.trim() } : {}),
          ...(size.trim() ? { size: size.trim() } : {}),
          status,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos crear la variante.");
        return;
      }
      toast.success("Variante creada");
      setTitle("");
      setSku("");
      setPrice("");
      setStock("0");
      setColor("");
      setSize("");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function deleteVariant(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/products/variants?id=${id}`, {
        method: "DELETE",
        headers: { [CSRF_HEADER]: csrf },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No se pudo eliminar.");
        return;
      }
      toast.success("Variante eliminada");
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="mb-3 text-sm font-medium text-ml-white/70">
        Variantes ({variants.length})
      </p>
      {variants.length > 0 && (
        <ul className="mb-4 flex flex-col gap-1.5">
          {variants.map((variant) => (
            <li
              key={variant.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs"
            >
              <span className="truncate">
                <span className="font-semibold">{variant.title}</span>
                {variant.sku && (
                  <span className="ml-2 text-ml-white/45">{variant.sku}</span>
                )}
                <span className="ml-2 text-ml-white/55">
                  stock {variant.stock}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <StatusBadge status={variant.status} />
                <button
                  type="button"
                  onClick={() => deleteVariant(variant.id)}
                  disabled={busy}
                  aria-label="Eliminar variante"
                  className="text-ml-white/40 hover:text-ml-coral disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título *" className={inputClass} />
        <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" className={inputClass} />
        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Precio" className={inputClass} />
        <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" placeholder="Stock" className={inputClass} />
        <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" className={inputClass} />
        <input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Talla" className={inputClass} />
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as (typeof VARIANT_STATUSES)[number])
          }
          className={inputClass}
        >
          {VARIANT_STATUSES.map((option) => (
            <option key={option} value={option} className="bg-ml-bg">
              {option}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={addVariant}
          disabled={busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ml-violet/20 px-3 py-2.5 text-sm font-semibold text-ml-violet transition hover:bg-ml-violet/30 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar
        </button>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Drawer } from "vaul";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Expand,
  Loader2,
  MessageCircle,
  Save,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { emitCartUpdated } from "@/components/store/CartBadge";
import SchoolLabelPreview from "@/components/designer/school-labels/SchoolLabelPreview";
import TypographyGallery from "@/components/designer/school-labels/TypographyGallery";
import ColorPaletteGallery from "@/components/designer/school-labels/ColorPaletteGallery";
import CustomImageUploader from "@/components/designer/school-labels/CustomImageUploader";
import AutoBackgroundPreview from "@/components/designer/school-labels/AutoBackgroundPreview";
import {
  SCHOOL_ADDONS,
  SCHOOL_FIELD_LIMITS,
  SCHOOL_PACKAGES,
  getSchoolPackage,
  type SchoolPackageId,
} from "@/lib/designer/school-labels/config";
import { getSchoolColorPalette } from "@/lib/designer/school-labels/color-palettes";
import { getBackgroundForPalette } from "@/lib/designer/school-labels/background-presets";
import { renderSchoolLabelPreview } from "@/lib/designer/school-labels/preview";
import { validateSchoolStudent } from "@/lib/validation/school-labels";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/db/types";

interface SchoolLabelsLabProps {
  /**
   * Producto base de la tienda. Puede llegar null si el seed aún no se aplicó:
   * el wizard sigue funcionando en modo previsualización y solo se bloquean
   * Guardar / Agregar al carrito.
   */
  product: ProductWithVariants | null;
}

interface StudentState {
  firstName: string;
  lastName1: string;
  lastName2: string;
  nickname: string;
  school: string;
  grade: string;
  group: string;
}

interface UploadedAsset {
  assetId: string;
  fileName: string;
}

// Stepper tipo chips, deslizable en móvil.
const STEPS = [
  "Paquete",
  "Nombre",
  "Tipografía",
  "Color",
  "Imagen",
  "Preview",
] as const;
const TOTAL_STEPS = STEPS.length;

const UPLOAD_ACCEPT = ["image/png", "image/jpeg", "image/webp"];
const UPLOAD_MAX_BYTES = 8 * 1024 * 1024;

export default function SchoolLabelsLab({ product }: SchoolLabelsLabProps) {
  const [step, setStep] = useState(1);

  const [pkg, setPkg] = useState<SchoolPackageId | null>(null);
  const [designCount, setDesignCount] = useState<1 | 2>(1);
  const [student, setStudent] = useState<StudentState>({
    firstName: "",
    lastName1: "",
    lastName2: "",
    nickname: "",
    school: "",
    grade: "",
    group: "",
  });
  const [typographyCode, setTypographyCode] = useState<string | null>(null);
  const [colorCode, setColorCode] = useState<string | null>(null);

  // Imagen propia (opcional).
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<UploadedAsset | null>(null);
  const [imgUploading, setImgUploading] = useState(false);
  const [imgUploadedOk, setImgUploadedOk] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // Detalles opcionales (no estorban el flujo).
  const [theme, setTheme] = useState("");
  const [notes, setNotes] = useState("");
  const [addons, setAddons] = useState<string[]>([]);

  const [designId, setDesignId] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewSheetOpen, setPreviewSheetOpen] = useState(false);

  const localPreviewRef = useRef<string | null>(null);
  localPreviewRef.current = localPreview;

  // Limpia el object URL al desmontar.
  useEffect(() => {
    return () => {
      if (localPreviewRef.current) URL.revokeObjectURL(localPreviewRef.current);
    };
  }, []);

  const markDirty = useCallback(() => setSaved(false), []);

  const hasBaseProduct = product !== null;

  const variantForPackage = useMemo(() => {
    return (id: SchoolPackageId | null) => {
      if (!id || !product) return null;
      const label = getSchoolPackage(id)?.variantLabel?.trim().toLowerCase();
      const variants = product.variants ?? [];
      const norm = (v?: string | null) => v?.trim().toLowerCase() ?? "";
      return (
        variants.find(
          (v) => norm(v.option_label) === label || norm(v.title) === label,
        ) ??
        variants[0] ??
        null
      );
    };
  }, [product]);

  const studentValidation = useMemo(
    () => validateSchoolStudent(student),
    [student],
  );

  const stepValid = useCallback(
    (s: number): boolean => {
      switch (s) {
        case 1:
          return pkg !== null;
        case 2:
          return studentValidation.ok;
        case 3:
          return typographyCode !== null;
        case 4:
          return colorCode !== null;
        default:
          return true; // 5 (imagen, opcional) y 6 (preview) siempre alcanzables
      }
    },
    [pkg, studentValidation.ok, typographyCode, colorCode],
  );

  const canReach = useCallback(
    (target: number): boolean => {
      for (let s = 1; s < target; s++) {
        if (!stepValid(s)) return false;
      }
      return true;
    },
    [stepValid],
  );

  function goNext() {
    if (!stepValid(step)) {
      toast.error(
        step === 2
          ? "Escribe el nombre y al menos un apellido."
          : "Completa este paso para continuar.",
      );
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function updateStudent<K extends keyof StudentState>(key: K, value: string) {
    setStudent((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function toggleAddon(id: string) {
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
    markDirty();
  }

  const fullyValid =
    pkg !== null &&
    studentValidation.ok &&
    typographyCode !== null &&
    colorCode !== null;

  function buildDesignJson(): Record<string, unknown> {
    const trimmed = (v: string) => v.trim();
    const studentJson: Record<string, string> = {
      firstName: trimmed(student.firstName),
      lastName1: trimmed(student.lastName1),
    };
    if (trimmed(student.lastName2)) studentJson.lastName2 = trimmed(student.lastName2);
    if (trimmed(student.nickname)) studentJson.nickname = trimmed(student.nickname);
    if (trimmed(student.school)) studentJson.school = trimmed(student.school);
    if (trimmed(student.grade)) studentJson.grade = trimmed(student.grade);
    if (trimmed(student.group)) studentJson.group = trimmed(student.group);

    const json: Record<string, unknown> = {
      version: 1,
      designerType: "school-labels",
      productType: "etiquetas-escolares",
      productHandle: product?.handle ?? "etiquetas-escolares-personalizadas",
      package: pkg,
      student: studentJson,
      typographyCode,
      colorCode,
      backgroundPreset: getBackgroundForPalette(colorCode).id,
      addons,
    };
    if (pkg === "ultra") json.designCount = designCount;
    if (uploadedAsset) {
      json.customImage = {
        assetId: uploadedAsset.assetId,
        fileName: uploadedAsset.fileName,
      };
    }
    if (trimmed(theme)) json.theme = trimmed(theme);
    if (trimmed(notes)) json.notes = trimmed(notes);
    return json;
  }

  const ensureDesign = useCallback(async (): Promise<string | null> => {
    if (designId) return designId;
    if (!pkg) return null;
    if (!product) {
      setPreviewOnly(true);
      return null;
    }
    const variant = variantForPackage(pkg);
    try {
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: "etiquetas-escolares",
          productId: product.id,
          ...(variant ? { variantId: variant.id } : {}),
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
  }, [designId, pkg, product, variantForPackage]);

  // -------------------------------------------------------------------------
  // Imagen propia
  // -------------------------------------------------------------------------
  function setPreview(url: string | null) {
    setLocalPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }

  async function handleFileSelected(file: File) {
    if (!UPLOAD_ACCEPT.includes(file.type)) {
      setImgError("Formato no permitido. Usa PNG, JPG, JPEG o WEBP.");
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setImgError("La imagen es muy grande (máx. 8 MB).");
      return;
    }
    setImgError(null);
    setImgUploadedOk(false);
    setUploadedAsset(null);
    setPreview(URL.createObjectURL(file));
    setImageFileName(file.name);
    markDirty();

    // Sin producto base no se puede persistir: la preview local basta.
    if (!product) return;

    const id = await ensureDesign();
    if (!id) return; // previewOnly lo marca ensureDesign

    setImgUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("designProjectId", id);
      const res = await fetch("/api/uploads/design-assets", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        if (data?.code === "STORAGE_NOT_CONFIGURED" || res.status === 503) {
          setPreviewOnly(true);
          return;
        }
        setImgError(data?.error ?? "No pudimos subir tu imagen.");
        return;
      }
      setUploadedAsset({
        assetId: data.assetId as string,
        fileName: (data.fileName as string) ?? file.name,
      });
      setImgUploadedOk(true);
    } catch {
      setImgError("Sin conexión. Intenta subir la imagen de nuevo.");
    } finally {
      setImgUploading(false);
    }
  }

  function handleRemoveImage() {
    setPreview(null);
    setImageFileName(null);
    setUploadedAsset(null);
    setImgUploadedOk(false);
    setImgError(null);
    markDirty();
  }

  // -------------------------------------------------------------------------
  // Guardar / carrito
  // -------------------------------------------------------------------------
  async function saveDesign(showToast = true): Promise<string | null> {
    if (!fullyValid) {
      toast.error("Completa paquete, nombre, tipografía y color.");
      return null;
    }
    const id = await ensureDesign();
    if (!id || !product) return null;
    setSaving(true);
    try {
      const variant = variantForPackage(pkg);
      const rawPreview = renderSchoolLabelPreview({
        firstName: student.firstName,
        lastName1: student.lastName1,
        lastName2: student.lastName2,
        nickname: student.nickname,
        typographyCode: typographyCode!,
        colorCode: colorCode!,
      });
      const previewDataUrl =
        rawPreview && rawPreview.length <= 200_000 ? rawPreview : null;
      const res = await fetch(`/api/designs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designerType: "school-labels",
          productType: "etiquetas-escolares",
          productId: product.id,
          ...(variant ? { variantId: variant.id } : {}),
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
    if (!product) {
      toast.error(
        "El producto base aún no está disponible. Aplica el seed o cotiza por WhatsApp.",
      );
      return;
    }
    const variant = variantForPackage(pkg);
    if (!variant) {
      toast.error("Este paquete no está disponible por ahora.");
      return;
    }
    setAddingToCart(true);
    try {
      const id = await saveDesign(false);
      if (!id) {
        if (previewOnly) {
          toast.error(
            "Estás en modo previsualización: aún no podemos agregarlo al carrito.",
          );
        }
        return;
      }
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
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
      toast.success("¡Tus etiquetas escolares están en el carrito!", {
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

  const whatsappUrl = buildWhatsAppUrl(
    whatsappMessages.schoolLabels({
      pkg: pkg ? getSchoolPackage(pkg)?.name : undefined,
      typographyCode: typographyCode ?? undefined,
      colorCode: colorCode ?? undefined,
      name: student.firstName.trim() || undefined,
    }),
  );

  const displayName =
    student.nickname.trim() || student.firstName.trim() || "Tu nombre";
  const previewBg = getBackgroundForPalette(colorCode);

  const previewNode = (
    <SchoolLabelPreview
      firstName={student.firstName}
      lastName1={student.lastName1}
      lastName2={student.lastName2}
      nickname={student.nickname}
      typographyCode={typographyCode ?? "001"}
      colorCode={colorCode ?? "ARC"}
      theme={theme}
      imageUrl={localPreview}
    />
  );

  const actionsNode = (
    <div className="flex flex-col gap-3">
      {!hasBaseProduct ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
          El producto base aún no está en el catálogo. Puedes armar y
          previsualizar tu pedido; para guardar o agregar al carrito, aplica el
          seed o cotízalo por WhatsApp.
        </p>
      ) : (
        previewOnly && (
          <p className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs leading-relaxed text-violet-700">
            Estás en modo previsualización. Para guardar o agregar al carrito,
            termina de configurar el almacenamiento o escríbenos por WhatsApp.
          </p>
        )
      )}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!fullyValid || addingToCart || previewOnly || !hasBaseProduct}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-400 px-6 py-3.5 font-bold text-slate-900 shadow-lg shadow-cyan-400/25 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {addingToCart ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <ShoppingBag className="h-5 w-5" aria-hidden />
        )}
        Agregar al carrito
      </button>
      <button
        type="button"
        onClick={() => saveDesign(true)}
        disabled={!fullyValid || saving || previewOnly || !hasBaseProduct}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-300 bg-violet-50 px-6 py-3 font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Save className="h-5 w-5" aria-hidden />
        )}
        {saved ? "Diseño guardado ✓" : "Guardar diseño"}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-300 hover:text-violet-600"
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Enviar por WhatsApp
      </a>
    </div>
  );

  return (
    <div id="wizard" className="flex flex-col gap-6">
      {/* Stepper de chips (deslizable en móvil) */}
      <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible [scrollbar-width:none]">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step && stepValid(n);
          const reachable = canReach(n);
          return (
            <li key={label} className="shrink-0">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(n)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  active
                    ? "border-violet-500 bg-violet-600 text-white shadow"
                    : done
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-500",
                  !reachable && "cursor-not-allowed opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    active
                      ? "bg-white/25 text-white"
                      : done
                        ? "bg-violet-500 text-white"
                        : "bg-slate-100 text-slate-500",
                  )}
                >
                  {done ? <Check className="h-3 w-3" aria-hidden /> : n}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ol>

      {/* Preview compacto + "Ver preview grande" (solo móvil) */}
      <button
        type="button"
        onClick={() => setPreviewSheetOpen(true)}
        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-sm lg:hidden"
      >
        <span
          className="relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-xl"
          style={{ background: previewBg.gradient }}
          aria-hidden
        >
          <span className="absolute inset-0 bg-black/15" />
          <span className="relative max-w-full truncate px-1 text-xs font-bold text-white drop-shadow">
            {displayName}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-slate-700">
            Vista previa
          </span>
          <span className="block text-xs text-slate-400">
            Tipografía {typographyCode ?? "—"} · Color {colorCode ?? "—"}
          </span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-2 text-xs font-bold text-white">
          <Expand className="h-3.5 w-3.5" aria-hidden />
          Ver grande
        </span>
      </button>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Contenido del paso */}
        <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-7">
          {step === 1 && (
            <StepPackage
              pkg={pkg}
              designCount={designCount}
              onSelect={(p) => {
                setPkg(p);
                if (p !== "ultra") setDesignCount(1);
                markDirty();
              }}
              onDesignCountChange={(c) => {
                setDesignCount(c);
                markDirty();
              }}
              whatsappUrl={whatsappUrl}
            />
          )}
          {step === 2 && (
            <StepName
              student={student}
              errors={studentValidation.errors}
              onChange={updateStudent}
            />
          )}
          {step === 3 && (
            <div>
              <StepHeader
                title="Elige tu tipografía"
                subtitle="Toca la muestra que más te guste (código 001–054)."
              />
              <TypographyGallery
                firstName={student.firstName}
                selected={typographyCode}
                onSelect={(c) => {
                  setTypographyCode(c);
                  markDirty();
                }}
              />
            </div>
          )}
          {step === 4 && (
            <div>
              <StepHeader
                title="Elige tu combinación de colores"
                subtitle="Cada paleta activa un fondo automático acorde a la guía."
              />
              <ColorPaletteGallery
                selected={colorCode}
                onSelect={(c) => {
                  setColorCode(c);
                  markDirty();
                }}
              />
            </div>
          )}
          {step === 5 && (
            <StepImage
              colorCode={colorCode}
              localPreview={localPreview}
              imageFileName={imageFileName}
              imgUploading={imgUploading}
              imgUploadedOk={imgUploadedOk}
              imgError={imgError}
              hint={
                !hasBaseProduct || previewOnly
                  ? "En modo previsualización tu imagen se muestra aquí; para guardarla en el pedido aplica el seed o cotiza por WhatsApp."
                  : null
              }
              onFileSelected={handleFileSelected}
              onRemove={handleRemoveImage}
            />
          )}
          {step === 6 && (
            <StepPreview
              pkg={pkg}
              designCount={designCount}
              student={student}
              typographyCode={typographyCode}
              colorCode={colorCode}
              hasImage={Boolean(localPreview)}
              theme={theme}
              notes={notes}
              addons={addons}
              onThemeChange={(v) => {
                setTheme(v);
                markDirty();
              }}
              onNotesChange={(v) => {
                setNotes(v);
                markDirty();
              }}
              onToggleAddon={toggleAddon}
            />
          )}

          {/* Navegación de escritorio */}
          <div className="mt-8 hidden items-center justify-between gap-3 lg:flex">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-violet-700"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                Usa los botones de la derecha para finalizar →
              </span>
            )}
          </div>
        </section>

        {/* Preview lateral sticky (escritorio) */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-violet-400">
                Vista previa
              </p>
              {previewNode}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              {actionsNode}
            </div>
          </div>
        </aside>
      </div>

      {/* Barra de acciones sticky (solo móvil): flota con el wizard y se va al
          llegar a las secciones informativas, para no tapar contenido. */}
      <div className="sticky bottom-3 z-40 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-xl backdrop-blur lg:hidden">
        {step < TOTAL_STEPS ? (
          <div className="mx-auto flex max-w-md items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-violet-700"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => saveDesign(true)}
              disabled={!fullyValid || saving || previewOnly || !hasBaseProduct}
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-violet-300 bg-violet-50 px-2 py-2 text-[11px] font-bold text-violet-700 transition disabled:opacity-40"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Save className="h-4 w-4" aria-hidden />
              )}
              Guardar
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                !fullyValid || addingToCart || previewOnly || !hasBaseProduct
              }
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-cyan-400 px-2 py-2 text-[11px] font-bold text-slate-900 shadow transition disabled:opacity-40"
            >
              {addingToCart ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden />
              )}
              Carrito
            </button>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-col items-center justify-center gap-0.5 rounded-2xl border border-slate-300 bg-white px-2 py-2 text-[11px] font-bold text-slate-600 transition"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Bottom sheet de preview (móvil) */}
      <Drawer.Root open={previewSheetOpen} onOpenChange={setPreviewSheetOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white p-5 pb-8">
            <Drawer.Title className="sr-only">Vista previa grande</Drawer.Title>
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            {previewNode}
            <div className="mt-5">{actionsNode}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

// ===========================================================================
// Paso 1 — Paquete
// ===========================================================================
function StepPackage({
  pkg,
  designCount,
  onSelect,
  onDesignCountChange,
  whatsappUrl,
}: {
  pkg: SchoolPackageId | null;
  designCount: 1 | 2;
  onSelect: (p: SchoolPackageId) => void;
  onDesignCountChange: (c: 1 | 2) => void;
  whatsappUrl: string;
}) {
  return (
    <div>
      <StepHeader
        title="Elige tu paquete"
        subtitle="Selecciona el pack que mejor se adapte a lo que necesitas."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {SCHOOL_PACKAGES.map((p) => {
          const active = pkg === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm transition",
                active
                  ? "border-cyan-400 ring-2 ring-cyan-300"
                  : "border-slate-200 hover:border-violet-300 hover:shadow-md",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-800">{p.name}</h3>
                {active && <Check className="h-5 w-5 text-cyan-500" aria-hidden />}
              </div>
              <p className="text-sm text-slate-500">{p.description}</p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {p.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 text-xs text-slate-500"
                  >
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {pkg === "ultra" && (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2.5 text-sm font-semibold text-slate-700">
            ¿Cuántos diseños diferentes quieres? (Ultra permite hasta 2)
          </p>
          <div className="flex gap-3">
            {([1, 2] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onDesignCountChange(c)}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-2.5 text-sm font-bold transition",
                  designCount === c
                    ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-violet-300",
                )}
              >
                {c} {c === 1 ? "diseño" : "diseños"}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-slate-400">
        El precio final lo confirma MatrixLab según tu pedido.{" "}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-violet-600 hover:underline"
        >
          ¿No sabes cuál elegir? Cotiza por WhatsApp →
        </a>
      </p>
    </div>
  );
}

// ===========================================================================
// Paso 2 — Nombre
// ===========================================================================
function StepName({
  student,
  errors,
  onChange,
}: {
  student: StudentState;
  errors: Partial<Record<keyof StudentState, string>>;
  onChange: <K extends keyof StudentState>(key: K, value: string) => void;
}) {
  return (
    <div>
      <StepHeader
        title="Nombre del estudiante"
        subtitle="Con esto personalizamos tus etiquetas. Solo el nombre y un apellido son obligatorios."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" error={errors.firstName}>
          <input
            value={student.firstName}
            maxLength={SCHOOL_FIELD_LIMITS.name}
            onChange={(e) => onChange("firstName", e.target.value)}
            className={inputClass}
            placeholder="Ej. Sofía"
          />
        </Field>
        <Field label="Apellido paterno *" error={errors.lastName1}>
          <input
            value={student.lastName1}
            maxLength={SCHOOL_FIELD_LIMITS.name}
            onChange={(e) => onChange("lastName1", e.target.value)}
            className={inputClass}
            placeholder="Ej. García"
          />
        </Field>
        <Field label="Apellido materno">
          <input
            value={student.lastName2}
            maxLength={SCHOOL_FIELD_LIMITS.name}
            onChange={(e) => onChange("lastName2", e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Nombre corto o apodo">
          <input
            value={student.nickname}
            maxLength={SCHOOL_FIELD_LIMITS.nickname}
            onChange={(e) => onChange("nickname", e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </Field>
        <Field label="Colegio">
          <input
            value={student.school}
            maxLength={SCHOOL_FIELD_LIMITS.school}
            onChange={(e) => onChange("school", e.target.value)}
            className={inputClass}
            placeholder="Opcional"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Grado">
            <input
              value={student.grade}
              maxLength={SCHOOL_FIELD_LIMITS.grade}
              onChange={(e) => onChange("grade", e.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Grupo">
            <input
              value={student.group}
              maxLength={SCHOOL_FIELD_LIMITS.group}
              onChange={(e) => onChange("group", e.target.value)}
              className={inputClass}
              placeholder="Opcional"
            />
          </Field>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        No incluyas datos sensibles (dirección, teléfono, datos de pago). Solo
        guardamos lo necesario para producir tus etiquetas.
      </p>
    </div>
  );
}

// ===========================================================================
// Paso 5 — Imagen
// ===========================================================================
function StepImage({
  colorCode,
  localPreview,
  imageFileName,
  imgUploading,
  imgUploadedOk,
  imgError,
  hint,
  onFileSelected,
  onRemove,
}: {
  colorCode: string | null;
  localPreview: string | null;
  imageFileName: string | null;
  imgUploading: boolean;
  imgUploadedOk: boolean;
  imgError: string | null;
  hint: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <StepHeader
        title="Crear mi diseño con imagen"
        subtitle="Opcional: sube una imagen o referencia y la integramos a tu etiqueta."
      />
      <CustomImageUploader
        previewUrl={localPreview}
        fileName={imageFileName}
        uploading={imgUploading}
        uploadedOk={imgUploadedOk}
        error={imgError}
        hint={hint}
        onFileSelected={onFileSelected}
        onRemove={onRemove}
      />
      <div className="mt-5">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-violet-400">
          Fondo automático
        </p>
        <AutoBackgroundPreview colorCode={colorCode} />
        <p className="mt-2 text-xs text-slate-400">
          No tienes que diseñar el fondo: lo generamos automáticamente según la
          paleta que elegiste. Puedes cambiar la paleta en el paso anterior.
        </p>
      </div>
    </div>
  );
}

// ===========================================================================
// Paso 6 — Preview / resumen
// ===========================================================================
function StepPreview({
  pkg,
  designCount,
  student,
  typographyCode,
  colorCode,
  hasImage,
  theme,
  notes,
  addons,
  onThemeChange,
  onNotesChange,
  onToggleAddon,
}: {
  pkg: SchoolPackageId | null;
  designCount: 1 | 2;
  student: StudentState;
  typographyCode: string | null;
  colorCode: string | null;
  hasImage: boolean;
  theme: string;
  notes: string;
  addons: string[];
  onThemeChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onToggleAddon: (id: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const palette = colorCode ? getSchoolColorPalette(colorCode) : null;
  const bg = getBackgroundForPalette(colorCode);
  const fullName = [student.firstName, student.lastName1, student.lastName2]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" ");
  const packageLabel = pkg
    ? `${getSchoolPackage(pkg)?.name}${
        pkg === "ultra"
          ? ` · ${designCount} diseño${designCount === 2 ? "s" : ""}`
          : ""
      }`
    : "—";

  const selectableAddons = SCHOOL_ADDONS.filter((a) => !a.quoteOnly);

  return (
    <div>
      <StepHeader
        title="Tu diseño está listo 🎉"
        subtitle="Revisa el resumen y guárdalo, agrégalo al carrito o envíalo por WhatsApp."
      />
      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <SummaryRow label="Paquete" value={packageLabel} />
        <SummaryRow label="Nombre completo" value={fullName || "—"} />
        <SummaryRow label="Tipografía" value={typographyCode ?? "—"} />
        <SummaryRow
          label="Color"
          value={palette ? `${palette.code} · ${palette.name}` : colorCode ?? "—"}
        />
        <SummaryRow label="Fondo automático" value={bg.label} />
        <SummaryRow label="Imagen propia" value={hasImage ? "Incluida" : "Sin imagen"} />
      </dl>

      {/* Detalles opcionales (no obligan a nada). */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-bold text-slate-700"
        >
          Detalles opcionales
          <span className="text-xs font-medium text-slate-400">
            {showDetails ? "Ocultar" : "Mostrar"}
          </span>
        </button>
        {showDetails && (
          <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4">
            <Field label="Temática deseada">
              <input
                value={theme}
                maxLength={SCHOOL_FIELD_LIMITS.theme}
                onChange={(e) => onThemeChange(e.target.value)}
                className={inputClass}
                placeholder="Ej. espacio, dinosaurios, flores…"
              />
            </Field>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-600">
                Add-ons opcionales
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectableAddons.map((addon) => {
                  const active = addons.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => onToggleAddon(addon.id)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition",
                        active
                          ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-violet-300",
                      )}
                    >
                      {addon.name}
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          active
                            ? "border-cyan-400 bg-cyan-400 text-white"
                            : "border-slate-300",
                        )}
                      >
                        {active && <Check className="h-3 w-3" aria-hidden />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Notas para el laboratorio">
              <textarea
                rows={3}
                value={notes}
                maxLength={SCHOOL_FIELD_LIMITS.notes}
                onChange={(e) => onNotesChange(e.target.value)}
                className={inputClass}
                placeholder="Cualquier detalle final de tu pedido…"
              />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================================================
// Helpers de UI (tema claro, fiel al PDF)
// ===========================================================================
const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-black text-slate-800 sm:text-2xl">{title}</h2>
      <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-bold text-slate-700">{value || "—"}</dd>
    </div>
  );
}

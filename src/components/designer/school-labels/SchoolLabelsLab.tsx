"use client";

import { useCallback, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MessageCircle,
  Save,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { emitCartUpdated } from "@/components/store/CartBadge";
import SchoolLabelPreview from "@/components/designer/school-labels/SchoolLabelPreview";
import {
  SCHOOL_ADDONS,
  SCHOOL_FIELD_LIMITS,
  SCHOOL_PACKAGES,
  getSchoolPackage,
  type SchoolPackageId,
} from "@/lib/designer/school-labels/config";
import {
  groupSchoolColorPalettes,
  getSchoolColorPalette,
} from "@/lib/designer/school-labels/color-palettes";
import {
  groupSchoolTypographyByPage,
  type SchoolTypographyOption,
} from "@/lib/designer/school-labels/typography-options";
import { renderSchoolLabelPreview } from "@/lib/designer/school-labels/preview";
import { validateSchoolStudent } from "@/lib/validation/school-labels";
import { buildWhatsAppUrl, whatsappMessages } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { ProductWithVariants } from "@/lib/db/types";

interface SchoolLabelsLabProps {
  /**
   * Producto base de la tienda. Puede llegar null si el seed aún no se aplicó
   * o el catálogo no lo expone: en ese caso el wizard sigue funcionando en
   * modo previsualización y solo se bloquean Guardar / Agregar al carrito.
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

const STEPS = [
  "Paquete",
  "Estudiante",
  "Tipografía",
  "Colores",
  "Temática",
  "Add-ons",
  "Resumen",
] as const;

const TOTAL_STEPS = STEPS.length;

// Estilos de fallback para variar visualmente las muestras de tipografía
// cuando aún no existe el thumbnail real recortado del PDF.
const FALLBACK_STYLES: Array<CSSProperties> = [
  { fontFamily: "Georgia, serif", fontWeight: 700 },
  { fontFamily: "'Brush Script MT', cursive", fontStyle: "italic", fontWeight: 400 },
  { fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 700, letterSpacing: "0.04em" },
  { fontFamily: "'Courier New', monospace", fontWeight: 700, textTransform: "uppercase" },
  { fontFamily: "Palatino, 'Palatino Linotype', serif", fontStyle: "italic", fontWeight: 600 },
  { fontFamily: "'Comic Sans MS', 'Comic Sans', cursive", fontWeight: 700 },
  { fontFamily: "Verdana, sans-serif", fontWeight: 700, letterSpacing: "0.08em" },
];

function fallbackStyle(code: string): CSSProperties {
  const n = parseInt(code, 10) || 0;
  return FALLBACK_STYLES[n % FALLBACK_STYLES.length]!;
}

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
  const [theme, setTheme] = useState("");
  const [characterInspiration, setCharacterInspiration] = useState("");
  const [decorativeIcons, setDecorativeIcons] = useState("");
  const [specialColors, setSpecialColors] = useState("");
  const [designComments, setDesignComments] = useState("");
  const [addons, setAddons] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const [designId, setDesignId] = useState<string | null>(null);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [saved, setSaved] = useState(false);

  const markDirty = useCallback(() => setSaved(false), []);

  // Sin producto base persistible: el wizard funciona en modo previsualización.
  const hasBaseProduct = product !== null;

  const variantForPackage = useMemo(() => {
    return (id: SchoolPackageId | null) => {
      if (!id || !product) return null;
      const label = getSchoolPackage(id)?.variantLabel?.trim().toLowerCase();
      const variants = product.variants ?? [];
      const norm = (v?: string | null) => v?.trim().toLowerCase() ?? "";
      // Empareja por option_label o título (sin distinguir mayúsculas); si no
      // hay coincidencia, cae a la primera variante para no bloquear el carrito.
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
          return true; // pasos 5, 6, 7 son opcionales / finales
      }
    },
    [pkg, studentValidation.ok, typographyCode, colorCode],
  );

  // Un paso es alcanzable si todos los anteriores son válidos.
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
      if (step === 2) {
        toast.error("Completa el nombre y al menos un apellido.");
      } else {
        toast.error("Completa este paso para continuar.");
      }
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }

  function goPrev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function updateStudent<K extends keyof StudentState>(
    key: K,
    value: string,
  ) {
    setStudent((prev) => ({ ...prev, [key]: value }));
    markDirty();
  }

  function toggleAddon(id: string) {
    setAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
    markDirty();
  }

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
      addons,
    };
    // Ultra puede llevar hasta 2 diseños diferentes.
    if (pkg === "ultra") json.designCount = designCount;
    if (trimmed(theme)) json.theme = trimmed(theme);
    if (trimmed(decorativeIcons)) json.decorativeIcons = trimmed(decorativeIcons);
    if (trimmed(characterInspiration))
      json.characterInspiration = trimmed(characterInspiration);
    if (trimmed(specialColors)) json.specialColors = trimmed(specialColors);
    if (trimmed(designComments)) json.designComments = trimmed(designComments);
    if (trimmed(notes)) json.notes = trimmed(notes);
    return json;
  }

  const ensureDesign = useCallback(async (): Promise<string | null> => {
    if (designId) return designId;
    if (!pkg) return null;
    // Sin producto base no hay nada persistible: modo previsualización.
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

  const fullyValid =
    pkg !== null &&
    studentValidation.ok &&
    typographyCode !== null &&
    colorCode !== null;

  async function saveDesign(showToast = true): Promise<string | null> {
    if (!fullyValid) {
      toast.error("Completa paquete, datos del estudiante, tipografía y color.");
      return null;
    }
    const id = await ensureDesign();
    if (!id || !product) return null;
    setSaving(true);
    try {
      const variant = variantForPackage(pkg);
      const previewDataUrl = renderSchoolLabelPreview({
        firstName: student.firstName,
        lastName1: student.lastName1,
        lastName2: student.lastName2,
        nickname: student.nickname,
        typographyCode: typographyCode!,
        colorCode: colorCode!,
      });
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

  return (
    <div className="flex flex-col gap-8">
      {/* Stepper */}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step && stepValid(n);
          const reachable = canReach(n);
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && setStep(n)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-ml-cyan/50 bg-ml-cyan/15 text-ml-cyan"
                    : done
                      ? "border-ml-violet/40 bg-ml-violet/10 text-ml-violet"
                      : "border-white/12 bg-white/5 text-ml-white/55",
                  !reachable && "cursor-not-allowed opacity-40",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    active
                      ? "bg-ml-cyan text-ml-bg"
                      : done
                        ? "bg-ml-violet text-ml-bg"
                        : "bg-white/10",
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="glass-strong rounded-3xl p-5 sm:p-7">
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
            <StepStudent
              student={student}
              errors={studentValidation.errors}
              onChange={updateStudent}
            />
          )}
          {step === 3 && (
            <StepTypography
              firstName={student.firstName}
              selected={typographyCode}
              onSelect={(c) => { setTypographyCode(c); markDirty(); }}
            />
          )}
          {step === 4 && (
            <StepColors
              selected={colorCode}
              onSelect={(c) => { setColorCode(c); markDirty(); }}
            />
          )}
          {step === 5 && (
            <StepTheme
              theme={theme}
              characterInspiration={characterInspiration}
              decorativeIcons={decorativeIcons}
              specialColors={specialColors}
              designComments={designComments}
              onChange={(field, value) => {
                if (field === "theme") setTheme(value);
                else if (field === "characterInspiration") setCharacterInspiration(value);
                else if (field === "decorativeIcons") setDecorativeIcons(value);
                else if (field === "specialColors") setSpecialColors(value);
                else if (field === "designComments") setDesignComments(value);
                markDirty();
              }}
            />
          )}
          {step === 6 && (
            <StepAddons
              addons={addons}
              onToggle={toggleAddon}
              whatsappUrl={whatsappUrl}
            />
          )}
          {step === 7 && (
            <StepSummary
              pkg={pkg}
              designCount={designCount}
              student={student}
              typographyCode={typographyCode}
              colorCode={colorCode}
              theme={theme}
              addons={addons}
              notes={notes}
              onNotesChange={(v) => { setNotes(v); markDirty(); }}
            />
          )}

          {/* Navegación */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 1}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-ml-white/70 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Atrás
            </button>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-full bg-ml-cyan px-5 py-2.5 text-sm font-semibold text-ml-bg shadow-glow-cyan transition hover:bg-ml-cyan/90"
              >
                Continuar
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <span className="text-xs text-ml-white/45">
                Revisa tu resumen y guarda tu diseño →
              </span>
            )}
          </div>
        </section>

        {/* Panel lateral: preview en vivo + acciones */}
        <aside className="flex flex-col gap-5">
          <div className="glass rounded-2xl p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ml-white/45">
              Vista previa
            </p>
            <SchoolLabelPreview
              firstName={student.firstName}
              lastName1={student.lastName1}
              lastName2={student.lastName2}
              nickname={student.nickname}
              typographyCode={typographyCode ?? "001"}
              colorCode={colorCode ?? "ARC"}
              theme={theme}
            />
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex flex-col gap-3">
              {!hasBaseProduct ? (
                <p className="rounded-2xl border border-ml-coral/30 bg-ml-coral/10 px-4 py-3 text-xs leading-relaxed text-ml-white/80">
                  El producto base de etiquetas escolares aún no está en el
                  catálogo. Puedes armar y previsualizar tu pedido; para guardar
                  o agregar al carrito, aplica el seed
                  (supabase/seed_school_labels.sql) o cotízalo por WhatsApp.
                </p>
              ) : (
                previewOnly && (
                  <p className="rounded-2xl border border-ml-violet/30 bg-ml-violet/10 px-4 py-3 text-xs leading-relaxed text-ml-white/80">
                    Estás en modo previsualización: puedes armar tu pedido. Para
                    guardar o agregar al carrito, termina de configurar el
                    almacenamiento o escríbenos por WhatsApp.
                  </p>
                )
              )}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!fullyValid || addingToCart || previewOnly || !hasBaseProduct}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-cyan px-6 py-4 font-semibold text-ml-bg shadow-glow-cyan transition hover:bg-ml-cyan/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-violet/40 bg-ml-violet/10 px-6 py-3.5 font-semibold text-ml-violet transition hover:bg-ml-violet/20 disabled:cursor-not-allowed disabled:opacity-40"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-ml-white/85 transition hover:border-white/30"
              >
                <MessageCircle className="h-4.5 w-4.5" aria-hidden />
                Prefiero armarlo por WhatsApp
              </a>
            </div>
          </div>
        </aside>
      </div>
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
                "flex flex-col gap-3 rounded-2xl border p-5 text-left transition",
                active
                  ? "border-ml-cyan/60 bg-ml-cyan/10 shadow-glow-cyan"
                  : "border-white/12 bg-white/5 hover:border-ml-violet/40",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {active && <Check className="h-5 w-5 text-ml-cyan" aria-hidden />}
              </div>
              <p className="text-sm text-ml-white/65">{p.description}</p>
              <ul className="mt-1 flex flex-col gap-1.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs text-ml-white/60">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ml-violet" aria-hidden />
                    {h}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Ultra: cuántos diseños diferentes (hasta 2). */}
      {pkg === "ultra" && (
        <div className="mt-5 rounded-2xl border border-white/12 bg-white/5 p-4">
          <p className="mb-2.5 text-sm font-medium text-ml-white/75">
            ¿Cuántos diseños diferentes quieres? (Ultra permite hasta 2)
          </p>
          <div className="flex gap-3">
            {([1, 2] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onDesignCountChange(c)}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
                  designCount === c
                    ? "border-ml-cyan/60 bg-ml-cyan/10 text-ml-cyan"
                    : "border-white/12 bg-white/5 text-ml-white/70 hover:border-ml-violet/40",
                )}
              >
                {c} {c === 1 ? "diseño" : "diseños"}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-ml-white/50">
        El precio final lo confirma MatrixLab según tu pedido. Si hay opciones de
        upgrade de material disponibles en catálogo, las verás como add-on.{" "}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ml-coral hover:underline"
        >
          ¿No sabes cuál elegir? Cotiza por WhatsApp →
        </a>
      </p>
    </div>
  );
}

// ===========================================================================
// Paso 2 — Datos del estudiante
// ===========================================================================
function StepStudent({
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
        title="Datos del estudiante"
        subtitle="Usaremos estos datos para personalizar las etiquetas."
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
      <p className="mt-4 text-xs text-ml-white/45">
        No incluyas datos sensibles (dirección, teléfono, datos de pago). Solo
        guardamos lo necesario para producir tus etiquetas.
      </p>
    </div>
  );
}

// ===========================================================================
// Paso 3 — Tipografía
// ===========================================================================
function StepTypography({
  firstName,
  selected,
  onSelect,
}: {
  firstName: string;
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const groups = groupSchoolTypographyByPage();
  const previewName = firstName.trim() || "Nombre";
  return (
    <div>
      <StepHeader
        title="Elige tu tipografía"
        subtitle="Usa el código de 3 dígitos de tu tipografía favorita (001–054)."
      />
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.page}>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ml-white/45">
              Parte {group.page} de 6
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {group.options.map((opt) => (
                <TypographyCard
                  key={opt.code}
                  option={opt}
                  previewName={previewName}
                  active={selected === opt.code}
                  onSelect={() => onSelect(opt.code)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypographyCard({
  option,
  previewName,
  active,
  onSelect,
}: {
  option: SchoolTypographyOption;
  previewName: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [imgOk, setImgOk] = useState(false);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group relative flex aspect-[4/3] flex-col items-center justify-center overflow-hidden rounded-xl border p-2 transition",
        active
          ? "border-ml-cyan/60 bg-ml-cyan/10 shadow-glow-cyan"
          : "border-white/12 bg-white/5 hover:border-ml-violet/40",
      )}
    >
      <span className="absolute left-1.5 top-1.5 rounded-md bg-black/45 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {option.code}
      </span>
      {active && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ml-cyan text-ml-bg">
          <Check className="h-3 w-3" aria-hidden />
        </span>
      )}
      {/* Fallback con nombre estilizado (visible por defecto). */}
      <span
        className="px-1 text-center text-lg leading-tight text-ml-white"
        style={fallbackStyle(option.code)}
      >
        {previewName}
      </span>
      {/* Thumbnail real opcional: si carga, se sobrepone al fallback. */}
      {option.previewImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={option.previewImage}
          alt={`Tipografía ${option.code}`}
          onLoad={() => setImgOk(true)}
          onError={() => setImgOk(false)}
          className={cn(
            "absolute inset-0 h-full w-full object-contain p-2 transition-opacity",
            imgOk ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </button>
  );
}

// ===========================================================================
// Paso 4 — Colores
// ===========================================================================
function StepColors({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const groups = groupSchoolColorPalettes();
  return (
    <div>
      <StepHeader
        title="Elige tu combinación de colores"
        subtitle="Usa el código de 3 letras de tu combinación favorita."
      />
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <div key={group.group}>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ml-white/45">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {group.palettes.map((p) => {
                const active = selected === p.code;
                return (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => onSelect(p.code)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col gap-2 rounded-xl border p-3 text-left transition",
                      active
                        ? "border-ml-cyan/60 bg-ml-cyan/10 shadow-glow-cyan"
                        : "border-white/12 bg-white/5 hover:border-ml-violet/40",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-black/35 px-1.5 py-0.5 text-[11px] font-bold text-white">
                        {p.code}
                      </span>
                      {active && <Check className="h-4 w-4 text-ml-cyan" aria-hidden />}
                    </div>
                    <div className="flex h-7 overflow-hidden rounded-lg">
                      {p.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="flex-1"
                          style={{ backgroundColor: hex }}
                          aria-hidden
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-ml-white/80">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// Paso 5 — Temática y estilo
// ===========================================================================
function StepTheme({
  theme,
  characterInspiration,
  decorativeIcons,
  specialColors,
  designComments,
  onChange,
}: {
  theme: string;
  characterInspiration: string;
  decorativeIcons: string;
  specialColors: string;
  designComments: string;
  onChange: (
    field:
      | "theme"
      | "characterInspiration"
      | "decorativeIcons"
      | "specialColors"
      | "designComments",
    value: string,
  ) => void;
}) {
  return (
    <div>
      <StepHeader
        title="Temática y estilo"
        subtitle="Puedes usar el diseño tal como aparece en el ejemplo o pedir ajustes de colores, iconos o temática."
      />
      <div className="grid gap-4">
        <Field label="Temática deseada">
          <input
            value={theme}
            maxLength={SCHOOL_FIELD_LIMITS.theme}
            onChange={(e) => onChange("theme", e.target.value)}
            className={inputClass}
            placeholder="Ej. espacio, dinosaurios, flores…"
          />
        </Field>
        <Field label="Personaje o inspiración">
          <input
            value={characterInspiration}
            maxLength={SCHOOL_FIELD_LIMITS.characterInspiration}
            onChange={(e) => onChange("characterInspiration", e.target.value)}
            className={inputClass}
            placeholder="Temática inspirada en… / estilo similar a…"
          />
        </Field>
        <Field label="Iconos decorativos">
          <input
            value={decorativeIcons}
            maxLength={SCHOOL_FIELD_LIMITS.decorativeIcons}
            onChange={(e) => onChange("decorativeIcons", e.target.value)}
            className={inputClass}
            placeholder="Ej. estrellas, cohetes, corazones…"
          />
        </Field>
        <Field label="Colores especiales (opcional)">
          <input
            value={specialColors}
            maxLength={SCHOOL_FIELD_LIMITS.specialColors}
            onChange={(e) => onChange("specialColors", e.target.value)}
            className={inputClass}
            placeholder="Si quieres ajustar la combinación elegida"
          />
        </Field>
        <Field label="Comentarios de diseño">
          <textarea
            value={designComments}
            rows={3}
            maxLength={SCHOOL_FIELD_LIMITS.designComments}
            onChange={(e) => onChange("designComments", e.target.value)}
            className={inputClass}
            placeholder="Cualquier detalle adicional para tu diseño…"
          />
        </Field>
      </div>
      <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-ml-white/55">
        Usamos lenguaje de referencia: “temática inspirada en…”, “estilo
        similar…”. No ofrecemos personajes con copyright como productos
        oficiales.
      </p>
    </div>
  );
}

// ===========================================================================
// Paso 6 — Add-ons
// ===========================================================================
function StepAddons({
  addons,
  onToggle,
  whatsappUrl,
}: {
  addons: string[];
  onToggle: (id: string) => void;
  whatsappUrl: string;
}) {
  return (
    <div>
      <StepHeader
        title="Add-ons opcionales"
        subtitle="Agrega extras a tu pedido. MatrixLab confirma precio y disponibilidad."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {SCHOOL_ADDONS.map((addon) => {
          if (addon.quoteOnly) {
            return (
              <a
                key={addon.id}
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 rounded-2xl border border-ml-coral/30 bg-ml-coral/10 p-4 text-left transition hover:border-ml-coral/50"
              >
                <span className="flex items-center gap-2 font-semibold text-ml-coral">
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {addon.name}
                </span>
                <span className="text-xs text-ml-white/60">
                  {addon.description}
                </span>
              </a>
            );
          }
          const active = addons.includes(addon.id);
          return (
            <button
              key={addon.id}
              type="button"
              onClick={() => onToggle(addon.id)}
              aria-pressed={active}
              className={cn(
                "flex flex-col gap-1 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-ml-cyan/60 bg-ml-cyan/10"
                  : "border-white/12 bg-white/5 hover:border-ml-violet/40",
              )}
            >
              <span className="flex items-center justify-between font-semibold">
                {addon.name}
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-md border",
                    active
                      ? "border-ml-cyan bg-ml-cyan text-ml-bg"
                      : "border-white/25",
                  )}
                >
                  {active && <Check className="h-3.5 w-3.5" aria-hidden />}
                </span>
              </span>
              <span className="text-xs text-ml-white/60">
                {addon.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ===========================================================================
// Paso 7 — Resumen
// ===========================================================================
function StepSummary({
  pkg,
  designCount,
  student,
  typographyCode,
  colorCode,
  theme,
  addons,
  notes,
  onNotesChange,
}: {
  pkg: SchoolPackageId | null;
  designCount: 1 | 2;
  student: StudentState;
  typographyCode: string | null;
  colorCode: string | null;
  theme: string;
  addons: string[];
  notes: string;
  onNotesChange: (value: string) => void;
}) {
  const palette = colorCode ? getSchoolColorPalette(colorCode) : null;
  const fullName = [student.firstName, student.lastName1, student.lastName2]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" ");
  const addonNames = addons
    .map((id) => SCHOOL_ADDONS.find((a) => a.id === id)?.name ?? id)
    .join(", ");
  const packageLabel = pkg
    ? `${getSchoolPackage(pkg)?.name}${
        pkg === "ultra" ? ` · ${designCount} diseño${designCount === 2 ? "s" : ""}` : ""
      }`
    : "—";

  return (
    <div>
      <StepHeader
        title="Resumen y guardar"
        subtitle="Revisa tu pedido antes de guardar o agregar al carrito."
      />
      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <SummaryRow label="Paquete" value={packageLabel} />
        <SummaryRow label="Nombre completo" value={fullName || "—"} />
        <SummaryRow label="Tipografía" value={typographyCode ?? "—"} />
        <SummaryRow
          label="Color"
          value={palette ? `${palette.code} · ${palette.name}` : colorCode ?? "—"}
        />
        <SummaryRow label="Temática" value={theme.trim() || "—"} />
        <SummaryRow label="Add-ons" value={addonNames || "Sin add-ons"} />
      </dl>

      <div className="mt-5">
        <label
          htmlFor="school-notes"
          className="mb-1.5 block text-sm font-medium text-ml-white/70"
        >
          Notas para el laboratorio (opcional)
        </label>
        <textarea
          id="school-notes"
          rows={3}
          maxLength={SCHOOL_FIELD_LIMITS.notes}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Cualquier detalle final de tu pedido…"
          className={inputClass}
        />
      </div>

      <p className="mt-4 text-xs text-ml-white/45">
        Usa los botones de la derecha para guardar tu diseño, agregarlo al
        carrito o cotizar por WhatsApp.
      </p>
    </div>
  );
}

// ===========================================================================
// Helpers de UI
// ===========================================================================
const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan";

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
      <p className="mt-1.5 text-sm text-ml-white/60">{subtitle}</p>
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
      <label className="mb-1.5 block text-sm font-medium text-ml-white/70">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-ml-coral">{error}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <dt className="text-xs text-ml-white/45">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-ml-white/90">
        {value || "—"}
      </dd>
    </div>
  );
}

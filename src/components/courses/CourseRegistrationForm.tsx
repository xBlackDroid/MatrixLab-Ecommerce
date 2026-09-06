"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageCircle, PartyPopper, Ticket } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SparkleMark, TumblerArt } from "@/components/icons/CourseDecor";
import { COURSE_ANY_DATE_VALUE } from "@/lib/store/courses";
import type { CourseRegistrationRules } from "@/lib/store/courses/types";
import { normalizeMexicanPhone } from "@/lib/validation/checkout";
import { COURSE_HONEYPOT_FIELD } from "@/lib/validation/courses";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * Formulario de registro al taller.
 *
 * DECISIONES DE UX (el público es muy visual y no necesariamente técnico)
 * ----------------------------------------------------------------------
 * - Seis campos y ninguno de relleno. Sólo nombre y WhatsApp son obligatorios.
 * - La fecha y el número de lugares se eligen tocando TARJETAS GRANDES, no en
 *   un `<select>`. Un desplegable nativo en móvil abre una rueda diminuta y
 *   esconde las opciones justo cuando se está decidiendo.
 * - Los botones son enormes y el principal ocupa todo el ancho en móvil.
 * - Cero jerga: "Quiero mi lugar", no "Enviar solicitud".
 * - No parece un formulario de empresa: ni campo de "razón social", ni
 *   asteriscos por todos lados, ni una cuadrícula de dos columnas apretada.
 *
 * VALIDACIÓN
 * ----------
 * Este esquema es un ESPEJO del servidor para dar errores rápidos junto al
 * campo. Quien decide es `/api/cursos/registro`, que revalida todo con el
 * esquema derivado de la edición antes de guardar. Si los mensajes divergen,
 * manda el servidor.
 *
 * PRIVACIDAD
 * ----------
 * Los datos salen por POST en el cuerpo de la petición, nunca por query
 * params (que acaban en logs, en el Referer y en el historial). El componente
 * no los imprime en consola ni los guarda en `localStorage`.
 */

/** Opciones de "cuántos lugares". Se generan del tope de la edición. */
function partySizeOptions(max: number): string[] {
  return Array.from({ length: max }, (_, index) => String(index + 1));
}

function buildFormSchema(rules: CourseRegistrationRules) {
  const dateValues = new Set([
    ...rules.dateOptions.map((option) => option.value),
    COURSE_ANY_DATE_VALUE,
  ]);
  const sizes = new Set(partySizeOptions(rules.maxPartySize));

  return z.object({
    name: z
      .string()
      .trim()
      .min(2, "Escribe tu nombre.")
      .max(80, "Máximo 80 caracteres."),
    // Se reutiliza el normalizador DEL SERVIDOR en vez de escribir aquí una
    // regla parecida: con dos algoritmos, el navegador rechazaría formatos
    // (044/045, +52) que el servidor sí acepta y nadie llegaría a la rama que
    // los arregla.
    phone: z
      .string()
      .trim()
      .min(1, "Escribe tu WhatsApp.")
      .max(25, "Teléfono demasiado largo.")
      .regex(/^[0-9+()\s-]+$/, "Solo números, espacios y + ( ) -.")
      .refine(
        (value) => /^[0-9]{10}$/.test(normalizeMexicanPhone(value)),
        "Escribe los 10 dígitos de tu WhatsApp.",
      ),
    email: z
      .union([z.literal(""), z.email("Correo inválido.").max(120)])
      .optional(),
    preferredDate: z
      .string()
      .refine((value) => dateValues.has(value), "Elige una fecha."),
    // Se maneja como texto porque viene de un grupo de radios; el servidor lo
    // convierte y lo vuelve a validar contra el tope real de la edición.
    partySize: z
      .string()
      .refine((value) => sizes.has(value), "Elige cuántos lugares."),
    comment: z.string().trim().max(400, "Máximo 400 caracteres.").optional(),
    /** Campo trampa: ver `COURSE_HONEYPOT_FIELD`. Siempre vacío. */
    [COURSE_HONEYPOT_FIELD]: z.string().optional(),
  });
}

type CourseFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

/**
 * Props DELIBERADAMENTE ESTRECHAS.
 *
 * No recibe la `CourseEdition` entera aunque sería más cómodo. Dos razones:
 *
 *   1. Todo lo que se le pasa a un componente de cliente se serializa y viaja
 *      al navegador dentro del payload de hidratación. La edición lleva el
 *      temario, el FAQ y el copy del hero: kilobytes que este formulario no
 *      usa y que la página ya pintó en el servidor.
 *   2. Cuanto menos cruza la frontera, menos ocasiones hay de cruzar algo que
 *      no se puede serializar. Este componente ya provocó ese fallo una vez:
 *      la galería guardaba un `alt: (i) => string` en los datos y pasar la
 *      edición completa tiraba la página con "Functions cannot be passed
 *      directly to Client Components" — un error de RUNTIME que el build no ve.
 */
export default function CourseRegistrationForm({
  courseSlug,
  edition,
  rules,
}: {
  /** Slug del curso (`course_slug` en base). */
  courseSlug: string;
  /** Número de edición al que apunta el registro. */
  edition: number;
  /** Fechas del sondeo y tope de lugares: lo único que valida el formulario. */
  rules: CourseRegistrationRules;
}) {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);

  const dateChoices = [
    ...rules.dateOptions.map((option) => ({
      value: option.value,
      label: option.label,
      hint: "Prefiero este día",
    })),
    {
      value: COURSE_ANY_DATE_VALUE,
      label: "Cualquiera",
      hint: "Me acomodan los dos",
    },
  ];
  const sizes = partySizeOptions(rules.maxPartySize);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(buildFormSchema(rules)),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      preferredDate: "",
      partySize: "1",
      comment: "",
      [COURSE_HONEYPOT_FIELD]: "",
    },
  });

  async function onSubmit(values: CourseFormValues) {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/cursos/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          edition,
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          preferredDate: values.preferredDate,
          partySize: Number(values.partySize),
          comment: values.comment || undefined,
          // El campo trampa viaja siempre: si no se envía, no puede atrapar
          // a nadie.
          [COURSE_HONEYPOT_FIELD]: values[COURSE_HONEYPOT_FIELD] ?? "",
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        toast.error(
          data?.error ??
            "No pudimos guardar tu registro. Intenta de nuevo en un momento.",
        );
        return;
      }

      setDone(true);
      reset();
      // El foco viaja a la confirmación: sin esto, quien navega con teclado o
      // lector de pantalla se queda en un botón que ya no existe y no se
      // entera de que el registro salió bien.
      window.requestAnimationFrame(() => confirmationRef.current?.focus());
    } catch {
      toast.error("Sin conexión. Revisa tus datos e intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <ConfirmationPanel
        ref={confirmationRef}
        onRegisterAnother={() => setDone(false)}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="relative overflow-hidden rounded-[1.75rem] border border-ml-white/12 bg-ml-white/[0.04] p-6 backdrop-blur-[14px] sm:rounded-[2rem] sm:p-9"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ml-coral/12 via-transparent to-ml-violet/12"
        aria-hidden
      />
      <TumblerArt
        className="pointer-events-none absolute -bottom-12 -right-10 hidden h-56 w-56 text-ml-coral opacity-[0.07] sm:block"
        aria-hidden
      />

      {/* Campo trampa. Fuera de pantalla y fuera del árbol de accesibilidad:
          ni se ve, ni se tabula, ni lo anuncia un lector de pantalla. Un bot
          que rellena todos los inputs sí lo llena, y el servidor descarta ese
          envío respondiendo un éxito normal. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden"
      >
        <label htmlFor="ml-course-website">No llenar este campo</label>
        <input
          id="ml-course-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register(COURSE_HONEYPOT_FIELD)}
        />
      </div>

      <div className="relative space-y-7">
        <Field
          id="curso-nombre"
          label="¿Cómo te llamas?"
          error={errors.name?.message}
        >
          <input
            id="curso-nombre"
            type="text"
            autoComplete="name"
            placeholder="Tu nombre"
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? "curso-nombre-error" : undefined}
            className={inputClasses(Boolean(errors.name))}
            {...register("name")}
          />
        </Field>

        <Field
          id="curso-whatsapp"
          label="¿A qué WhatsApp te escribimos?"
          hint="Por aquí te confirmamos fecha y disponibilidad."
          error={errors.phone?.message}
        >
          <input
            id="curso-whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="55 1234 5678"
            aria-invalid={errors.phone ? "true" : undefined}
            aria-describedby={errors.phone ? "curso-whatsapp-error" : undefined}
            className={inputClasses(Boolean(errors.phone))}
            {...register("phone")}
          />
        </Field>

        <Field
          id="curso-email"
          label="Correo"
          hint="Opcional. Solo si prefieres que también te escribamos ahí."
          error={errors.email?.message}
        >
          <input
            id="curso-email"
            type="email"
            autoComplete="email"
            placeholder="tucorreo@ejemplo.com"
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? "curso-email-error" : undefined}
            className={inputClasses(Boolean(errors.email))}
            {...register("email")}
          />
        </Field>

        {/* Fecha: tarjetas grandes en vez de un desplegable. Es la pregunta
            del sondeo y tiene que verse entera de un golpe. */}
        {/* `role="radiogroup"` + `aria-invalid` en el GRUPO, no en cada radio:
            ARIA no admite `aria-invalid` en `role="radio"` (lo marca
            jsx-a11y/role-supports-aria-props) y un lector de pantalla lo
            ignoraría ahí. El <legend> sigue dando el nombre accesible. */}
        <fieldset
          role="radiogroup"
          aria-invalid={errors.preferredDate ? "true" : undefined}
          aria-describedby={
            errors.preferredDate ? "curso-fecha-error" : undefined
          }
        >
          <legend className="text-base font-semibold text-ml-white">
            ¿Qué día te acomoda?
          </legend>
          <p className="mt-1 text-sm text-ml-white/55">
            Todavía estamos eligiendo entre los dos. Tu respuesta decide.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {dateChoices.map((choice) => (
              <label
                key={choice.value}
                className="group relative flex cursor-pointer flex-col rounded-2xl border border-ml-white/12 bg-ml-white/[0.04] p-4 transition hover:border-ml-cyan/45 has-[:checked]:border-ml-cyan has-[:checked]:bg-ml-cyan/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ml-cyan/60"
              >
                <input
                  type="radio"
                  value={choice.value}
                  className="sr-only"
                  {...register("preferredDate")}
                />
                <span className="text-lg font-bold text-ml-white group-has-[:checked]:text-ml-cyan">
                  {choice.label}
                </span>
                <span className="mt-0.5 text-sm text-ml-white/55">
                  {choice.hint}
                </span>
              </label>
            ))}
          </div>
          {errors.preferredDate?.message && (
            <p
              id="curso-fecha-error"
              role="alert"
              className="mt-2 text-sm font-medium text-ml-coral"
            >
              {errors.preferredDate.message}
            </p>
          )}
        </fieldset>

        {/* Lugares: pastillas numéricas. Un `<select>` de 1 a 6 sería más
            código de accesibilidad y menos claro al tacto. */}
        <fieldset>
          <legend className="text-base font-semibold text-ml-white">
            ¿Cuántos lugares quieres?
          </legend>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {sizes.map((size) => (
              <label
                key={size}
                className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-2xl border border-ml-white/12 bg-ml-white/[0.04] text-lg font-bold text-ml-white transition hover:border-ml-violet/45 has-[:checked]:border-ml-violet has-[:checked]:bg-ml-violet/15 has-[:checked]:text-ml-violet has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ml-violet/60"
              >
                <input
                  type="radio"
                  value={size}
                  className="sr-only"
                  {...register("partySize")}
                />
                <span aria-hidden>{size}</span>
                <span className="sr-only">
                  {size === "1" ? "1 lugar" : `${size} lugares`}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-sm text-ml-white/55">
            ¿Van más de {rules.maxPartySize}? Escríbenos por WhatsApp y lo
            organizamos.
          </p>
          {errors.partySize?.message && (
            <p role="alert" className="mt-2 text-sm font-medium text-ml-coral">
              {errors.partySize.message}
            </p>
          )}
        </fieldset>

        <Field
          id="curso-comentario"
          label="¿Quieres contarnos algo?"
          hint="Opcional. Dudas, si vienes con alguien, lo que quieras."
          error={errors.comment?.message}
        >
          <textarea
            id="curso-comentario"
            rows={3}
            placeholder="Me interesa mucho la técnica de SnowGlobe…"
            aria-invalid={errors.comment ? "true" : undefined}
            aria-describedby={
              errors.comment ? "curso-comentario-error" : undefined
            }
            className={`${inputClasses(Boolean(errors.comment))} resize-y`}
            {...register("comment")}
          />
        </Field>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-ml-coral px-8 py-4 text-lg font-bold text-ml-bg shadow-glow-coral transition hover:scale-[1.01] hover:bg-ml-coral/90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-12"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Enviando…
              </>
            ) : (
              <>
                <Ticket className="h-5 w-5" aria-hidden />
                Quiero mi lugar
              </>
            )}
          </button>
          {/* Se dice ANTES de enviar qué pasa después. No se promete un lugar
              pagado ni reservado en firme, porque todavía no hay pago. */}
          <p className="mt-3 text-sm text-ml-white/50">
            No se cobra nada aquí. Te escribimos por WhatsApp para confirmar.
          </p>
        </div>
      </div>
    </form>
  );
}

/** Clases del input, con estado de error. */
function inputClasses(hasError: boolean): string {
  return `mt-2 w-full rounded-2xl border bg-ml-bg/50 px-4 py-3.5 text-base text-ml-white placeholder:text-ml-white/30 transition focus:outline-none focus:ring-2 ${
    hasError
      ? "border-ml-coral/70 focus:ring-ml-coral/50"
      : "border-ml-white/12 focus:border-ml-violet/50 focus:ring-ml-violet/40"
  }`;
}

/** Campo con etiqueta, ayuda opcional y mensaje de error. */
function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-base font-semibold text-ml-white">
        {label}
      </label>
      {hint && <p className="mt-1 text-sm text-ml-white/55">{hint}</p>}
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 text-sm font-medium text-ml-coral"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Confirmación tras el registro.
 *
 * El copy es deliberadamente exacto: el registro QUEDÓ RECIBIDO. No dice que
 * el lugar esté pagado ni reservado en firme, porque esta página todavía no
 * cobra y prometerlo sería lo primero que habría que desdecir por WhatsApp.
 */
function ConfirmationPanel({
  ref,
  onRegisterAnother,
}: {
  ref: React.Ref<HTMLDivElement>;
  onRegisterAnother: () => void;
}) {
  return (
    <div
      ref={ref}
      // `tabIndex={-1}` para poder recibir el foco por programa (no con Tab):
      // es lo que hace que un lector de pantalla anuncie la confirmación.
      tabIndex={-1}
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-[1.75rem] border border-ml-green/30 bg-ml-green/[0.07] p-8 text-center backdrop-blur-[14px] focus:outline-none sm:rounded-[2rem] sm:p-12"
    >
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-ml-green/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-ml-cyan/15 blur-3xl"
        aria-hidden
      />
      <SparkleMark
        className="pointer-events-none absolute right-10 top-8 h-6 w-6 text-ml-green opacity-40"
        aria-hidden
      />

      <div className="relative">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-ml-green/20 text-ml-green">
          <PartyPopper className="h-9 w-9" aria-hidden />
        </span>
        <h3 className="mt-6 text-2xl font-bold sm:text-3xl">
          ¡Tu registro quedó recibido! ✨
        </h3>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-ml-white/75">
          Te contactaremos por WhatsApp para confirmar fecha y disponibilidad.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-ml-white/50">
          Todavía no hay pago ni lugar apartado en firme: eso lo cerramos
          juntos en el mensaje.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={buildWhatsAppUrl(
              "Hola MatrixLab, acabo de registrarme al taller Cursos MatrixLab Tumbler.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-green px-7 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-green/90 sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Escribirnos ahora
          </a>
          <button
            type="button"
            onClick={onRegisterAnother}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-white/20 bg-ml-white/[0.06] px-7 py-3.5 font-semibold text-ml-white transition hover:border-ml-white/40 sm:w-auto"
          >
            Registrar a alguien más
          </button>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  BACK_TO_SCHOOL_ACCESSES,
  type BackToSchoolAccess,
} from "@/lib/store/back-to-school";

export type BackToSchoolAccent = "cyan" | "green";

/**
 * Clases completas por acento (Tailwind necesita los nombres estáticos).
 * Cada página conserva el acento que ya tenía su bloque escolar: verde en la
 * home, cyan en /tienda.
 */
const ACCENT_STYLES: Record<BackToSchoolAccent, { text: string; hover: string }> =
  {
    cyan: {
      text: "text-ml-cyan",
      hover: "hover:border-ml-cyan/50 hover:text-ml-white",
    },
    green: {
      text: "text-ml-green",
      hover: "hover:border-ml-green/50 hover:text-ml-white",
    },
  };

/**
 * Los dos accesos del bloque "Regreso a Clases": etiquetas personalizadas
 * (editor) y productos escolares (catálogo).
 *
 * Son dos PASTILLAS, no dos tarjetas. La versión anterior anidaba una tarjeta
 * dentro de la tarjeta de familia: se leía bien, pero triplicaba su alto y
 * como la rejilla estira toda la fila, arrastraba también a MatrixLab Laser.
 * En formato pastilla el bloque ocupa lo mismo que el CTA de las otras cinco
 * familias y la rejilla vuelve a estar pareja.
 *
 * Las dos juntas tienen que caber en UNA línea dentro de la tarjeta, que es
 * lo que mantiene su alto igual al de las demás; por eso van sin flecha final
 * y con relleno ajustado (el icono de cabecera ya las identifica como acción).
 *
 * Cada pastilla es su PROPIO `<Link>`: áreas clicables separadas, destinos
 * distintos y ningún enlace anidado dentro de otro. El fondo `bg-ml-bg/70` no
 * es decorativo: se pintan sobre el logo de la familia y sin él perderían
 * contraste. No usan `.glass` porque esa clase vive fuera de las capas de
 * Tailwind y gana a cualquier utilidad `bg-*`.
 */
export default function BackToSchoolAccesses({
  accent,
  className = "",
}: {
  accent: BackToSchoolAccent;
  className?: string;
}) {
  const s = ACCENT_STYLES[accent];

  return (
    <div className={`flex flex-wrap gap-2.5 ${className}`}>
      {BACK_TO_SCHOOL_ACCESSES.map((access: BackToSchoolAccess) => (
        <Link
          key={access.id}
          href={access.href}
          className={`inline-flex items-center gap-2 rounded-full border border-white/12 bg-ml-bg/70 px-3.5 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:-translate-y-0.5 ${s.text} ${s.hover}`}
        >
          <access.icon className="h-4 w-4 shrink-0" aria-hidden />
          {access.label}
        </Link>
      ))}
    </div>
  );
}

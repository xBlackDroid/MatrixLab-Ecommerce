import { Loader2 } from "lucide-react";

/** Feedback inmediato al abrir Etiquetas Escolares Lab (página force-dynamic). */
export default function SchoolLabelsLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1400px] flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
      <Loader2 className="h-9 w-9 animate-spin text-ml-cyan" aria-hidden />
      <p className="text-sm text-ml-white/55">Abriendo Etiquetas Escolares Lab…</p>
    </div>
  );
}

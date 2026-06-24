import { Loader2 } from "lucide-react";

/**
 * Estado de carga del laboratorio. Da feedback inmediato al navegar desde
 * /tienda/disenador hacia un laboratorio (la página es force-dynamic y resuelve
 * el producto base en el servidor), evitando la sensación de "no responde".
 */
export default function DesignerLoading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[1400px] flex-col items-center justify-center gap-4 px-4 py-10 sm:px-6">
      <Loader2 className="h-9 w-9 animate-spin text-ml-violet" aria-hidden />
      <p className="text-sm text-ml-white/55">Abriendo tu laboratorio…</p>
    </div>
  );
}

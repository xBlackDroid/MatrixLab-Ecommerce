"use client";

import { useRef, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Subida de la imagen/referencia propia del cliente (opcional).
 * Componente controlado: el padre maneja la subida real y el object URL local
 * para la preview inmediata. Acepta PNG/JPG/JPEG/WEBP.
 */

interface CustomImageUploaderProps {
  previewUrl: string | null;
  fileName: string | null;
  uploading: boolean;
  uploadedOk: boolean;
  error: string | null;
  /** Mensaje informativo (p. ej. modo previsualización sin storage). */
  hint?: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

const ACCEPT = "image/png,image/jpeg,image/webp";

export default function CustomImageUploader({
  previewUrl,
  fileName,
  uploading,
  uploadedOk,
  error,
  hint,
  onFileSelected,
  onRemove,
}: CustomImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div className="flex flex-col gap-3">
      {previewUrl ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Tu imagen"
            className="h-28 w-28 shrink-0 rounded-xl border border-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" aria-hidden />
              ) : uploadedOk ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
              ) : null}
              {uploading
                ? "Subiendo tu imagen…"
                : uploadedOk
                  ? "Imagen lista"
                  : "Imagen cargada"}
            </p>
            {fileName && (
              <p className="mt-0.5 truncate text-xs text-slate-400">{fileName}</p>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Cambiar
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Quitar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-white px-4 py-9 text-center transition",
            dragging
              ? "border-cyan-400 bg-cyan-50"
              : "border-slate-300 hover:border-violet-400 hover:bg-violet-50/40",
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <ImagePlus className="h-6 w-6" aria-hidden />
          </span>
          <span className="text-base font-bold text-slate-700">
            Crear mi diseño con imagen
          </span>
          <span className="text-sm text-slate-500">
            Sube tu imagen o referencia — arrástrala o haz clic
          </span>
          <span className="text-xs text-slate-400">
            PNG, JPG, JPEG o WEBP
          </span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && (
        <p className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
          <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {hint}
        </p>
      )}
    </div>
  );
}

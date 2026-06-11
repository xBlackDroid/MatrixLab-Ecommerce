"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadPanelProps {
  hasImage: boolean;
  uploading: boolean;
  uploadedOk: boolean;
  fileName: string | null;
  onFileSelected: (file: File) => void;
}

/** Subida del arte del cliente (PNG recomendado). */
export default function UploadPanel({
  hasImage,
  uploading,
  uploadedOk,
  fileName,
  onFileSelected,
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ml-white/70">Tu diseño</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition",
          dragging
            ? "border-ml-cyan bg-ml-cyan/10"
            : "border-white/15 bg-white/5 hover:border-ml-violet/50",
        )}
      >
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-ml-violet" aria-hidden />
        ) : hasImage ? (
          <RefreshCw className="h-7 w-7 text-ml-violet" aria-hidden />
        ) : (
          <ImagePlus className="h-7 w-7 text-ml-violet" aria-hidden />
        )}
        <span className="text-sm font-semibold">
          {uploading
            ? "Subiendo tu diseño…"
            : hasImage
              ? "Cambiar imagen"
              : "Sube tu imagen"}
        </span>
        <span className="text-xs text-ml-white/50">
          PNG, JPG o WEBP · arrástrala o haz clic
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="mt-2 text-xs text-ml-white/50">
        Usa imágenes PNG de buena calidad para mejores resultados.
      </p>
      {fileName && (
        <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-ml-white/65">
          {uploadedOk && (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ml-cyan" aria-hidden />
          )}
          {fileName}
        </p>
      )}
    </div>
  );
}

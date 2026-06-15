"use client";

import { useState } from "react";
import { Type } from "lucide-react";
import { LASER_FONTS, LASER_TEXT_MAX_LENGTH } from "@/lib/designer/laser-config";

/** Herramienta para agregar texto corto al diseño láser. */
export default function LaserTextTool({
  onAdd,
}: {
  onAdd: (text: string, fontId: string) => void;
}) {
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState<string>(LASER_FONTS[0].id);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ml-white/70">Agregar texto</p>
      <input
        type="text"
        value={text}
        maxLength={LASER_TEXT_MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tu texto (máx. 40)"
        className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-cyan"
      />
      <select
        value={fontId}
        onChange={(e) => setFontId(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/15 bg-ml-bg px-3.5 py-2.5 text-sm text-ml-white outline-none transition focus:border-ml-cyan"
      >
        {LASER_FONTS.map((f) => (
          <option key={f.id} value={f.id} className="bg-ml-bg">
            {f.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          const value = text.trim();
          if (!value) return;
          onAdd(value, fontId);
          setText("");
        }}
        disabled={!text.trim()}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ml-violet/40 bg-ml-violet/10 px-4 py-2.5 text-sm font-semibold text-ml-violet transition hover:bg-ml-violet/20 disabled:opacity-40"
      >
        <Type className="h-4 w-4" aria-hidden />
        Agregar texto
      </button>
    </div>
  );
}

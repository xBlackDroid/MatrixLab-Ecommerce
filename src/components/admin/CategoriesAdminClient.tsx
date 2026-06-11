"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "@/components/admin/StatusBadge";
import type { CategoryRow } from "@/lib/db/types";
import { toHandle } from "@/lib/security/sanitize";

const CSRF_HEADER = "x-ml-csrf";

const inputClass =
  "w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet";

export default function CategoriesAdminClient({
  categories,
  csrf,
}: {
  categories: CategoryRow[];
  csrf: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-full bg-ml-violet px-5 py-2.5 text-sm font-semibold text-ml-bg transition hover:bg-ml-violet/90"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Nueva categoría
        </button>
      </div>

      <div className="glass overflow-x-auto rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-ml-white/45">
            <tr>
              <th className="px-5 py-3.5">Orden</th>
              <th className="px-5 py-3.5">Categoría</th>
              <th className="px-5 py-3.5">Handle</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-white/[0.03]">
                <td className="px-5 py-3.5 text-ml-white/55">
                  {category.sort_order}
                </td>
                <td className="px-5 py-3.5 font-semibold">{category.title}</td>
                <td className="px-5 py-3.5 text-ml-white/55">
                  /{category.handle}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={category.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing(category)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold transition hover:border-ml-violet/50 hover:text-ml-violet"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <CategoryForm
          category={editing}
          csrf={csrf}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function CategoryForm({
  category,
  csrf,
  onClose,
  onSaved,
}: {
  category: CategoryRow | null;
  csrf: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = category !== null;
  const [title, setTitle] = useState(category?.title ?? "");
  const [handle, setHandle] = useState(category?.handle ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(category?.sort_order ?? 0));
  const [status, setStatus] = useState<"activa" | "oculta">(
    category?.status ?? "activa",
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        handle: handle.trim(),
        description: description.trim(),
        sortOrder: Number(sortOrder) || 0,
        status,
      };
      const res = await fetch("/api/admin/categories", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", [CSRF_HEADER]: csrf },
        body: JSON.stringify(isEdit ? { id: category.id, ...payload } : payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "No pudimos guardar la categoría.");
        return;
      }
      toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
      <form
        onSubmit={handleSubmit}
        className="glass-strong w-full max-w-md rounded-3xl p-6 sm:p-8"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? "Editar categoría" : "Nueva categoría"}
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

        <div className="flex flex-col gap-3.5">
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (!isEdit) setHandle(toHandle(event.target.value));
            }}
            placeholder="Título *"
            required
            minLength={2}
            maxLength={80}
            className={inputClass}
          />
          <input
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="handle-url *"
            required
            pattern="[a-z0-9-]+"
            maxLength={120}
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción"
            rows={3}
            maxLength={1000}
            className={inputClass}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              type="number"
              min="0"
              max="999"
              placeholder="Orden"
              className={inputClass}
            />
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as "activa" | "oculta")
              }
              className={inputClass}
            >
              <option value="activa" className="bg-ml-bg">
                Activa
              </option>
              <option value="oculta" className="bg-ml-bg">
                Oculta
              </option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ml-violet px-6 py-3 text-sm font-semibold text-ml-bg transition hover:bg-ml-violet/90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {isEdit ? "Guardar cambios" : "Crear categoría"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || password.length < 8) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        toast.error(data?.error ?? "Credenciales inválidas.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("Sin conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <label htmlFor="admin-password" className="sr-only">
        Contraseña de acceso
      </label>
      <input
        id="admin-password"
        type="password"
        autoComplete="current-password"
        required
        minLength={8}
        maxLength={200}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña de acceso"
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-ml-white outline-none transition placeholder:text-ml-white/35 focus:border-ml-violet"
      />
      <button
        type="submit"
        disabled={loading || password.length < 8}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-ml-violet px-6 py-3.5 font-semibold text-ml-bg transition hover:bg-ml-violet/90 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="h-5 w-5" aria-hidden />
        )}
        Entrar al panel
      </button>
    </form>
  );
}

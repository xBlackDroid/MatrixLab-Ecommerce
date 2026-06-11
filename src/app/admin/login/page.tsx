import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { getAdminFromCookies } from "@/lib/security/admin-auth";
import { isAdminConfigured } from "@/lib/security/env";

export const metadata: Metadata = {
  title: "Acceso | MatrixLab Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const admin = await getAdminFromCookies();
  if (admin) redirect("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-sm rounded-3xl p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ml-violet/15 text-ml-violet">
          <FlaskConical className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">
          MatrixLab <span className="text-ml-violet">Admin</span>
        </h1>
        <p className="mt-2 text-sm text-ml-white/55">
          Panel interno del laboratorio. Solo personal autorizado.
        </p>
        <div className="mt-7">
          {isAdminConfigured() ? (
            <AdminLoginForm />
          ) : (
            <p className="rounded-xl border border-ml-coral/30 bg-ml-coral/10 px-4 py-3 text-sm text-ml-coral">
              El panel está bloqueado: configura ADMIN_ACCESS_PASSWORD y
              ADMIN_SESSION_SECRET en el servidor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

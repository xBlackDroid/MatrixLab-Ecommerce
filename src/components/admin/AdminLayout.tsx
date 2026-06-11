import AdminNav from "@/components/admin/AdminNav";

/**
 * Shell del panel admin. Cada página admin valida la sesión en servidor
 * (requireAdminPage) ANTES de renderizar este layout.
 */
export default function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AdminNav />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1.5 text-sm text-ml-white/60">{description}</p>
            )}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

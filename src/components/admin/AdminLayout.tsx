import AdminNav from "@/components/admin/AdminNav";
import { getServerEnv } from "@/lib/security/env";
import { ChevronDown } from "lucide-react";
import styles from "./mobile-admin.module.css";

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
    <div className={styles.shell}>
      <AdminNav consignmentsEnabled={getServerEnv().consignmentsEnabled} />
      <main id="main-content" tabIndex={-1} className={styles.page}>
        <div className={styles.pageHeading}>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
            {description && (
              <><p className={styles.desktopDescription}>{description}</p><details className={styles.mobileDescription}><summary>Información<ChevronDown size={14} aria-hidden /></summary><p>{description}</p></details></>
            )}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

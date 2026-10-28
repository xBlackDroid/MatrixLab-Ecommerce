import type { Metadata } from "next";
import { requireDistributorPage } from "@/lib/consignments/server";
import Workspace from "@/components/consignments/Workspace";
import DistributorNav from "@/components/consignments/DistributorNav";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi inventario | MatrixLab", robots: { index: false, follow: false } };
export default async function Page() {
  const s = await requireDistributorPage();
  return <div className="min-h-[100dvh]"><DistributorNav csrf={s.csrf} /><main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7"><Workspace distributorId={s.distributorId} admin={false} csrf={s.csrf} /></main></div>;
}

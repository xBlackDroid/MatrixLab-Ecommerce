import type { Metadata } from "next";
import { requireDistributorPage } from "@/lib/consignments/server";
import DistributorNav from "@/components/consignments/DistributorNav";
import Scanner from "@/components/consignments/Scanner";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Escanear pieza | MatrixLab", robots: { index: false, follow: false } };
export default async function Page() { const s = await requireDistributorPage(); return <div className="min-h-[100dvh]"><DistributorNav csrf={s.csrf} /><main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6"><Scanner /></main></div>; }

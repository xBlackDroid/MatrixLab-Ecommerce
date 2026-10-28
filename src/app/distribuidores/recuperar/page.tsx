import type { Metadata } from "next";
import { requireFeature } from "@/lib/consignments/server";
import Login from "@/components/consignments/Login";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recuperar acceso | MatrixLab", robots: { index: false, follow: false } };
export default function Page() { requireFeature(); return <Login reset />; }

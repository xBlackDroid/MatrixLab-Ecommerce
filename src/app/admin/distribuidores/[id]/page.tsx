import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdminPage } from "@/lib/security/admin-auth";
import { requireFeature } from "@/lib/consignments/server";
import AdminLayout from "@/components/admin/AdminLayout";
import Workspace from "@/components/consignments/Workspace";
import { readAdminSection } from "@/lib/consignments/navigation";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Consignaciones | MatrixLab", robots: { index: false, follow: false } };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ seccion?: string | string[] }> }) {
  requireFeature(); const s = await requireAdminPage(); const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const section = readAdminSection((await searchParams).seccion);
  return <AdminLayout title="Inventario del distribuidor" description="Piezas, entregas y usuarios vinculados a esta cuenta."><Workspace key={`${id}:${section}`} distributorId={id} admin csrf={s.csrf} initialSection={section} /></AdminLayout>;
}

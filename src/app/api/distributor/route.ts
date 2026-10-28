import { type NextRequest } from "next/server";
import { getDistributor } from "@/lib/consignments/server";
import { gate, fail, readAccount, parseCommand, runCommand } from "@/lib/consignments/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    const s = await getDistributor(req); if (!s) return fail("UNAUTHORIZED", 401, "Inicia sesión.");
    return await readAccount(req, s.distributorId, false);
  } catch { return fail("SERVICE", 503, "No pudimos consultar. Intenta de nuevo."); }
}
export async function POST(req: NextRequest) {
  try {
    const blocked = gate(req); if (blocked) return blocked;
    const s = await getDistributor(req, true); if (!s) return fail("UNAUTHORIZED", 401, "Sesión o confirmación inválida.");
    const parsed = await parseCommand(req); if (!parsed.success) return fail("INVALID", 400, "Revisa los datos capturados.");
    return await runCommand(req, s.distributorId, s.userId, "distribuidor", s.membershipId, parsed.data);
  } catch { return fail("SERVICE", 503, "No pudimos guardar. Conserva la confirmación."); }
}

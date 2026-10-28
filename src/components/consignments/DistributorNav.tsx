"use client";
import Link from "next/link";
import { useState } from "react";
import { LogOut, ScanLine } from "lucide-react";
import s from "./portal.module.css";
export default function DistributorNav({ csrf }: { csrf: string }) {
  const [error, setError] = useState("");
  return <header className={s.header}><nav className={s.headerBar}>
    <Link href="/distribuidores" className={s.brand}>
      <span className={s.brandName}>MatrixLab</span>
      <span className={s.brandRole}>Distribuidores</span>
    </Link>
    <div className={s.headerActions}>
      <Link href="/distribuidores/escanear" className={s.navAction}><ScanLine aria-hidden size={17} strokeWidth={1.75} />Escanear</Link>
      <button className={s.navAction} onClick={async () => {
      try { const r = await fetch("/api/distributor/auth", { method: "POST", headers: { "Content-Type": "application/json", "x-ml-csrf": csrf }, body: JSON.stringify({ action: "logout" }) });
        if (!r.ok) throw new Error("No pudimos cerrar sesión."); window.location.assign("/distribuidores/login"); } catch (e) { setError((e as Error).message); }
    }}><LogOut aria-hidden size={17} strokeWidth={1.75} />Salir</button>
    </div></nav>
    {error && <p role="alert" className={s.headerError}>{error}</p>}</header>;
}

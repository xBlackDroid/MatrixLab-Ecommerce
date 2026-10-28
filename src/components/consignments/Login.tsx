"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import s from "./portal.module.css";
export default function Login({ reset = false }: { reset?: boolean }) {
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  return <main className={s.auth}><Link href="/" aria-label="Ir a MatrixLab" className={s.authLogo}>
    <Image src="/images/categories/matrixlab-stickers.png" alt="MatrixLab Stickers" width={176} height={176} priority />
  </Link>
    <div className={s.authCard}>
      <div>
        <p className={s.eyebrow}>MatrixLab</p>
        <h1 className={s.authTitle}>{reset ? "Recuperar acceso" : "Acceso de distribuidores"}</h1>
        <p className={s.authIntro}>Consulta las piezas que MatrixLab te entrega y registra tus ventas.</p>
      </div>
    {reset ? <><p className={s.hint}>Solicita a MatrixLab restablecer tu contraseña. Sólo el administrador puede cambiar los accesos.</p>
      <Link href="/distribuidores/login" className={`${s.btn} ${s.ghost}`}>Volver al acceso</Link></> : <>
    <form className={s.authForm} onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMessage(""); const values = new FormData(e.currentTarget);
      try {
        const r = await fetch("/api/distributor/auth", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", username: values.get("username"), password: values.get("password") }) });
        const d = await r.json(); if (!r.ok) throw new Error(d.error);
        window.location.assign("/distribuidores");
      } catch (e) { setMessage((e as Error).message || "No hay conexión. Intenta de nuevo."); } finally { setBusy(false); }
    }}>
      <label className={s.field}>Usuario<input name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required minLength={3} maxLength={64} className={s.input} /></label>
      <div className={s.field}><label htmlFor="distributor-password">Contraseña</label><span className={s.passwordWrap}>
        <input id="distributor-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required maxLength={128} className={s.input} />
        <button type="button" className={s.reveal} aria-pressed={show} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow(!show)}>
          {show ? <EyeOff aria-hidden size={18} strokeWidth={1.75} /> : <Eye aria-hidden size={18} strokeWidth={1.75} />}</button></span></div>
      <button disabled={busy} className={`${s.btn} ${s.primary} ${s.block}`}>{busy ? "Procesando…" : "Entrar"}</button>
      {message && <p role="alert" className={s.alert}>{message}</p>}
    </form></>}
    </div>
    {!reset && <div className={s.authFoot}><Link href="/distribuidores/recuperar" className={`${s.btn} ${s.quiet}`}>Olvidé mi contraseña</Link></div>}
  </main>;
}

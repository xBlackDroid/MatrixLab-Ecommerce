"use client";
import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useRouter } from "next/navigation";
import s from "./portal.module.css";
export default function Scanner() {
  const video = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream | null>(null), timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const generation = useRef(0);
  const [error, setError] = useState(""), [active, setActive] = useState(false), [opening, setOpening] = useState(false); const router = useRouter();
  function stop() { generation.current++; if (timer.current) clearInterval(timer.current); timer.current = null; stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; }
  useEffect(() => { const hidden = () => { if (document.hidden) { stop(); setActive(false); setOpening(false); } }; document.addEventListener("visibilitychange", hidden); return () => { stop(); document.removeEventListener("visibilitychange", hidden); }; }, []);
  async function start() {
    stop(); const attempt = generation.current; setError(""); setOpening(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("La cámara necesita HTTPS y un dispositivo compatible. Usa el SKU o un lector.");
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      // Una respuesta tardía del permiso no debe encender la cámara después
      // de cancelar, cambiar de página o mandar la pestaña al fondo.
      if (attempt !== generation.current || document.hidden) { media.getTracks().forEach((t) => t.stop()); return; }
      stream.current = media; if (!video.current) { stop(); return; } video.current.srcObject = media; await video.current.play();
      if (attempt !== generation.current) return; setActive(true);
      const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d", { willReadFrequently: true });
      timer.current = setInterval(() => {
        const v = video.current; if (!v || !ctx || !v.videoWidth) return;
        canvas.width = Math.min(v.videoWidth, 800); canvas.height = Math.round(v.videoHeight * canvas.width / v.videoWidth);
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height); const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" });
        if (code) { stop(); setActive(false); router.push(`/distribuidores?scan=${encodeURIComponent(code.data)}`); }
      }, 250);
    } catch (e) {
      if (attempt !== generation.current) return;
      stop(); setActive(false); setOpening(false);
      const messages: Record<string, string> = {
        NotAllowedError: "No diste permiso de cámara. Puedes habilitarlo en el navegador o usar el código / SKU.",
        NotFoundError: "No encontramos una cámara disponible. Usa el código / SKU o un lector.",
        NotReadableError: "No pudimos acceder a la cámara; puede estar ocupada. Usa la captura manual.",
        NotSupportedError: "Este navegador no puede abrir la cámara. Usa uno compatible o la captura manual.",
      };
      setError(messages[(e as Error).name] || "No se pudo abrir la cámara. Usa la captura manual.");
    } finally { if (attempt === generation.current) setOpening(false); }
  }
  return <section className={s.scan}>
    <div><p className={s.eyebrow}>Venta</p><h1 className={s.title}>Escanear pieza</h1>
      <p className={s.subtitle}>Leer el código prepara la venta. Revisa cantidad y costo antes de confirmarla.</p></div>
    <div className={s.viewfinder}>
      <video ref={video} playsInline muted aria-label="Vista de cámara" />
      <span className={s.frame} aria-hidden />
      <span className={s.scanState}>{opening ? "Esperando permiso…" : active ? "Buscando código" : "Cámara apagada"}</span>
    </div>
    <button className={`${s.btn} ${s.primary} ${s.block}`} onClick={() => { if (active || opening) { stop(); setActive(false); setOpening(false); } else void start(); }}>{opening ? "Cancelar apertura de cámara" : active ? "Cerrar cámara" : "Abrir cámara"}</button>
    <p className={s.hint}>Al abrir la cámara, el navegador solicitará tu permiso. Puedes escanear o capturar el SKU sin dar acceso a la cámara.</p>
    {error && <p role="alert" className={s.alert}>{error}</p>}
    <form className={`${s.panel} ${s.authForm}`} onSubmit={(e) => { e.preventDefault(); stop(); const code = String(new FormData(e.currentTarget).get("code")); router.push(`/distribuidores?scan=${encodeURIComponent(code)}`); }}><label className={s.field}>Código o SKU<input name="code" required maxLength={100} className={s.input} /></label><button className={`${s.btn} ${s.ghost} ${s.block}`}>Buscar pieza manualmente</button></form>
  </section>;
}

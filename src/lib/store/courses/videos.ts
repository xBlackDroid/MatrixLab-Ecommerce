import type { CourseVideo } from "./types";

/**
 * "Mira lo que hacemos" — enlaces de video SIN incrustar.
 *
 * POR QUÉ NO HAY EMBED
 * --------------------
 * El reproductor de TikTok necesita `frame-src https://www.tiktok.com` y su
 * script `https://www.tiktok.com/embed.js`. La CSP del sitio declara
 * `frame-src 'none'` y `script-src 'self' 'nonce-…' 'strict-dynamic'`, o sea
 * sin terceros. Habilitar ese embed significaría meter en la página un script
 * y un iframe de otro origen —con acceso al DOM de un formulario que recoge
 * nombre, teléfono y correo— a cambio de una miniatura.
 *
 * La CSP NO se debilita. Cada video se publica como TARJETA DE VISTA PREVIA
 * que abre el enlace en una pestaña nueva (rel="noopener noreferrer").
 *
 * LISTA BLANCA DE HOSTS
 * ---------------------
 * Un enlace mal pegado en los datos no debe convertirse en un enlace saliente
 * a cualquier sitio con la marca MatrixLab encima. Sólo se publican URLs
 * https de estos dominios; lo demás se descarta en silencio.
 */
const ALLOWED_VIDEO_HOSTS: ReadonlySet<string> = new Set([
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "vt.tiktok.com",
  "instagram.com",
  "www.instagram.com",
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "facebook.com",
  "www.facebook.com",
  "fb.watch",
]);

/** Plataforma reconocida, para la etiqueta de la tarjeta. */
export type VideoPlatform = "TikTok" | "Instagram" | "YouTube" | "Facebook";

export interface SafeCourseVideo extends CourseVideo {
  platform: VideoPlatform;
}

function platformOf(host: string): VideoPlatform | null {
  if (host.endsWith("tiktok.com")) return "TikTok";
  if (host.endsWith("instagram.com")) return "Instagram";
  if (host.endsWith("youtube.com") || host === "youtu.be") return "YouTube";
  if (host.endsWith("facebook.com") || host === "fb.watch") return "Facebook";
  return null;
}

/**
 * Filtra la lista de videos a los que son publicables.
 *
 * Descarta: URLs inválidas, esquemas distintos de https (javascript: entre
 * ellos) y hosts fuera de la lista blanca. Devuelve la plataforma resuelta
 * para que la tarjeta no tenga que volver a parsear la URL.
 */
export function safeCourseVideos(
  videos: readonly CourseVideo[],
): SafeCourseVideo[] {
  const out: SafeCourseVideo[] = [];
  for (const video of videos) {
    let parsed: URL;
    try {
      parsed = new URL(video.url);
    } catch {
      continue;
    }
    if (parsed.protocol !== "https:") continue;
    const host = parsed.hostname.toLowerCase();
    if (!ALLOWED_VIDEO_HOSTS.has(host)) continue;
    const platform = platformOf(host);
    if (!platform) continue;
    out.push({ url: parsed.toString(), label: video.label, platform });
  }
  return out;
}

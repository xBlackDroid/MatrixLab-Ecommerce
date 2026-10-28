import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { CourseLocalVideo } from "./types";

export type LocalCourseVideo = CourseLocalVideo;

/** MP4 optimizados del taller, junto a su portada WebP. */
export function listLocalCourseVideos(edition: number): LocalCourseVideo[] {
  const dir = `videos/tumbler/cursos/edicion-${edition}`;
  try {
    const files = readdirSync(join(process.cwd(), "public", dir));
    return files.filter((name) => /^taller-\d{2}\.mp4$/.test(name))
      .sort()
      .map((name, index) => ({
        src: `/${dir}/${name}`,
        poster: `/${dir}/${name.replace(/\.mp4$/, ".webp")}`,
        label: `Momentos del taller · ${String(index + 1).padStart(2, "0")}`,
        width: 720,
        height: 1280,
      }));
  } catch {
    return [];
  }
}

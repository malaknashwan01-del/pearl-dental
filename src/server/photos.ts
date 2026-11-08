import "server-only";
import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * الصور الموجودة بمجلد public/photos، بالاسم بدون امتداد:
 * { "dr-sara": "/photos/dr-sara.webp", "hero": "/photos/hero.jpg", ... }
 * إذا صورة مش موجودة، الصفحة بتعرض البديل لحالها.
 */
export function getPhotos(): Record<string, string> {
  try {
    const dir = path.join(process.cwd(), "public", "photos");
    return Object.fromEntries(
      readdirSync(dir)
        .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
        .map((f) => [f.replace(/\.[^.]+$/, ""), `/photos/${f}`])
    );
  } catch {
    return {};
  }
}

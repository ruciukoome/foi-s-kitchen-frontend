/** Helpers for images, uploaded videos and embedded video links. */

export type MediaType = "image" | "video" | "embed";

/** Turn a YouTube / Vimeo / TikTok page link into an embeddable player URL. */
export function embedSrc(url: string): string {
  const raw = url.trim();
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (u.pathname.startsWith("/shorts/")) {
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2] ?? ""}`;
      }
      return raw;
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : raw;
    }
    if (host.endsWith("tiktok.com")) {
      const id = u.pathname.split("/video/")[1]?.split(/[/?]/)[0];
      return id ? `https://www.tiktok.com/embed/v2/${id}` : raw;
    }
    return raw;
  } catch {
    return raw;
  }
}

/** Guess the media type from a file name or link. */
export function guessMediaType(value: string): MediaType {
  const v = value.toLowerCase();
  if (/(youtube\.com|youtu\.be|vimeo\.com|tiktok\.com)/.test(v)) return "embed";
  if (/\.(mp4|webm|mov|m4v)(\?|$)/.test(v)) return "video";
  return "image";
}

export const isPlayable = (type: MediaType | null | undefined) =>
  type === "video" || type === "embed";

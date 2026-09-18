import { Facebook, Instagram, Youtube, type LucideIcon } from "lucide-react";

import { useSite } from "@/lib/site-info";
import { cn } from "@/lib/utils";

/** Lucide has no TikTok glyph — this matches its 24/1.75 stroke style. */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.2 4.3 5 4.5" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

export type SocialKey = "instagram" | "tiktok" | "facebook" | "x" | "youtube";

type Platform = {
  key: SocialKey;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  base: string;
};

export const socialPlatforms: Platform[] = [
  { key: "instagram", label: "Instagram", Icon: Instagram, base: "https://instagram.com/" },
  { key: "tiktok", label: "TikTok", Icon: TikTokIcon, base: "https://tiktok.com/@" },
  { key: "facebook", label: "Facebook", Icon: Facebook, base: "https://facebook.com/" },
  { key: "x", label: "X", Icon: XIcon, base: "https://x.com/" },
  { key: "youtube", label: "YouTube", Icon: Youtube, base: "https://youtube.com/@" },
];

/** Turns "@foiskitchen" or "foiskitchen" into a full link; passes URLs through. */
export function socialHref(value: string | undefined, base: string) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("www.")) return `https://${raw}`;
  return `${base}${raw.replace(/^@/, "")}`;
}

export function SocialLinks({
  className,
  itemClassName,
}: {
  className?: string;
  itemClassName?: string;
}) {
  const info = useSite();
  const socials = info.socials ?? {};

  const links = socialPlatforms
    .map((p) => ({ ...p, href: socialHref(socials[p.key], p.base) }))
    .filter((p) => p.href);

  if (links.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map(({ key, label, Icon, href }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/20 transition-colors duration-200 ease-out hover:text-primary",
              itemClassName,
            )}
          >
            <Icon className="h-5 w-5" />
          </a>
        </li>
      ))}
    </ul>
  );
}

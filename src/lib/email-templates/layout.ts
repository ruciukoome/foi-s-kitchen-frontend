// Brand hex values are inlined on purpose: email clients can't read CSS variables.
import { site } from "@/lib/site";
import { SITE_URL } from "@/lib/seo";

export const BRAND = {
  primary: "#8C1F35",
  cream: "#FBF6F4",
  charcoal: "#1A1613",
  gold: "#B98B4E",
  muted: "#6B625D",
};

export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Multi-line text → escaped HTML with line breaks. */
export const escLines = (v: string) => esc(v).replace(/\n/g, "<br>");

export function row(label: string, value: string | undefined | null) {
  if (!value) return "";
  return `<tr><td style="padding:6px 0;color:${BRAND.muted};font-size:14px;width:40%;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:${BRAND.charcoal};font-size:15px">${escLines(value)}</td></tr>`;
}

export function layout(opts: { preview: string; heading: string; intro: string; body: string; reference: string }) {
  const logo = `${SITE_URL}/favicon.png`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(opts.heading)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Lato,Helvetica,Arial,sans-serif;color:${BRAND.charcoal}">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preview)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${BRAND.cream};border-radius:16px">
<tr><td style="padding:28px 32px 12px;text-align:center">
<img src="${logo}" alt="${esc(site.name)}" width="56" height="56" style="border-radius:50%">
<p style="margin:8px 0 0;font-family:Poppins,Helvetica,Arial,sans-serif;font-weight:700;font-size:18px;color:${BRAND.primary}">${esc(site.name)}</p>
</td></tr>
<tr><td style="padding:0 32px"><div style="height:1px;background:${BRAND.gold}"></div></td></tr>
<tr><td style="padding:24px 32px">
<h1 style="margin:0 0 8px;font-family:Poppins,Helvetica,Arial,sans-serif;font-size:22px;color:${BRAND.charcoal}">${esc(opts.heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(opts.intro)}</p>
<p style="margin:0 0 20px;font-size:13px;color:${BRAND.muted}">Reference: <strong style="color:${BRAND.primary}">${esc(opts.reference)}</strong></p>
${opts.body}
</td></tr>
<tr><td style="padding:0 32px"><div style="height:1px;background:${BRAND.gold}"></div></td></tr>
<tr><td style="padding:20px 32px 28px;text-align:center;font-size:13px;color:${BRAND.muted};line-height:1.6">
${esc(site.name)} · ${esc(site.address)}<br>
<a href="tel:${esc(site.phoneTel)}" style="color:${BRAND.primary};text-decoration:none">${esc(site.phoneDisplay)}</a> ·
<a href="https://wa.me/${esc(site.whatsapp)}" style="color:${BRAND.primary};text-decoration:none">WhatsApp</a> ·
<a href="${SITE_URL}" style="color:${BRAND.primary};text-decoration:none">Website</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

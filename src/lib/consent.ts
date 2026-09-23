/**
 * Lightweight cookie-consent store.
 *
 * Today the site loads no analytics or marketing pixels — the only third-party
 * script is Google sign-in, which is essential and loads on demand. Anything
 * non-essential added later MUST be gated behind hasOptionalConsent().
 */
export type ConsentChoice = "accepted" | "rejected";

const KEY = "foi-cookie-consent";

export function readConsent(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
}

export function writeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    /* storage unavailable */
  }
}

/** True only when the visitor explicitly accepted non-essential cookies. */
export function hasOptionalConsent() {
  return readConsent() === "accepted";
}

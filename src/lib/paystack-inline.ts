/** Loads Paystack's inline popup script once per page (browser only). */
const SRC = "https://js.paystack.co/v2/inline.js";

type PaystackPopup = {
  resumeTransaction: (
    accessCode: string,
    options?: {
      onSuccess?: (tx: { reference: string }) => void;
      onCancel?: () => void;
      onError?: (err: unknown) => void;
    },
  ) => void;
};

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopup;
  }
}

let pending: Promise<void> | null = null;

export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.PaystackPop) return Promise.resolve();
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      pending = null;
      reject(new Error("Could not load the payment window"));
    });
    if (!existing) document.head.appendChild(script);
  });
  return pending;
}

export function newPaystackPopup(): PaystackPopup {
  if (!window.PaystackPop) throw new Error("Payment window not ready");
  return new window.PaystackPop();
}

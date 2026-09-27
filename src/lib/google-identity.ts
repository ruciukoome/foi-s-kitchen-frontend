export type GoogleCredentialResponse = {
  credential?: string;
};

export type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        cancel_on_tap_outside?: boolean;
        use_fedcm_for_prompt?: boolean;
        itp_support?: boolean;
        auto_select?: boolean;
      }) => void;
      prompt: (listener?: (notification: unknown) => void) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
      cancel: () => void;
      disableAutoSelect?: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

let googleIdentityScriptPromise: Promise<void> | undefined;

/** Loads Google's Identity Services script once per page. */
export function loadGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.google?.accounts.id) return Promise.resolve();
  if (googleIdentityScriptPromise) return googleIdentityScriptPromise;

  googleIdentityScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google sign-in did not load.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in did not load."));
    document.head.appendChild(script);
  });

  return googleIdentityScriptPromise;
}

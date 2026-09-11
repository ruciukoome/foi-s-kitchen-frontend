export type AuthFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

/**
 * Turns a Supabase auth error into a friendly message attached to the field
 * the customer can actually fix.
 */
export function mapAuthError(error: unknown, mode: "sign-in" | "sign-up" | "reset" | "recover"): AuthFieldErrors {
  const raw = error instanceof Error ? error.message : "";
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return { password: "That email and password don't match. Check them and try again." };
  }
  if (message.includes("email not confirmed")) {
    return { email: "Please confirm your email first — check your inbox for the link." };
  }
  if (message.includes("user already registered") || message.includes("already been registered")) {
    return { email: "An account already exists for this email. Try signing in instead." };
  }
  if (message.includes("invalid email") || message.includes("email address") || message.includes("is invalid")) {
    return { email: "Please enter a valid email address." };
  }
  if (message.includes("password should be at least") || message.includes("password is too short")) {
    return { password: "Password is too short — use at least 6 characters." };
  }
  if (message.includes("weak password") || message.includes("password should contain")) {
    return { password: raw || "Please choose a stronger password." };
  }
  if (message.includes("same as the old password") || message.includes("should be different")) {
    return { password: "Please choose a password different from your current one." };
  }
  if (message.includes("rate limit") || message.includes("too many") || message.includes("after")) {
    return { form: "Too many attempts. Please wait a moment and try again." };
  }
  if (message.includes("failed to fetch") || message.includes("network")) {
    return { form: "We couldn't reach the server. Check your connection and try again." };
  }
  if (message.includes("expired") || message.includes("token")) {
    return {
      form:
        mode === "reset"
          ? "This reset link is no longer valid. Please request a new one."
          : "Your session expired. Please try again.",
    };
  }
  return { form: raw || "Something went wrong. Please try again." };
}

export const unavailableError: AuthFieldErrors = {
  form: "Accounts aren't available right now. Please try again shortly.",
};

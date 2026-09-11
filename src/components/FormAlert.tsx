import { AlertCircle } from "lucide-react";

/** Inline, non-blocking error banner used at the top of auth forms. */
export function FormAlert({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

import { Link } from "@tanstack/react-router";

/** Required pre-transaction consent (Kenya Consumer Protection Act disclosure). */
export function TermsConsent({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-start gap-3 text-[15px] text-foreground">
      <input
        id={id}
        type="checkbox"
        required
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-primary"
      />
      <span>
        I have read and agree to the{" "}
        <Link to="/terms" target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link to="/refund-policy" target="_blank" className="font-semibold text-primary underline-offset-2 hover:underline">
          Refund Policy
        </Link>
        .
      </span>
    </label>
  );
}

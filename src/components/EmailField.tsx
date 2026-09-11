import { fieldClass } from "@/lib/ui";

type EmailFieldProps = {
  id: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null | undefined;
};

/** Email input with inline, field-level error messaging. */
export function EmailField({ id, label = "Email", value, onChange, error }: EmailFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="label-caps text-xs">
        {label}
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        required
        className={`${fieldClass} ${error ? "border-destructive" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

export function Field({ label, error, hint, name, ...input }: FieldProps) {
  const describedBy = [error && `${name}-error`, hint && `${name}-hint`].filter(Boolean).join(" ");
  return (
    <div className="mt-3">
      <label htmlFor={name} className="mb-1 block text-sm text-mute">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className="w-full rounded-[10px] border border-line bg-bg px-3 py-2.5 text-ink aria-invalid:border-err"
        {...input}
      />
      {hint && (
        <p id={`${name}-hint`} className="mt-1 text-sm text-mute">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-err">
          {error}
        </p>
      )}
    </div>
  );
}

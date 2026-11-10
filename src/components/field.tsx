import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
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

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  name: string;
  label: string;
  error?: string;
};

export function TextAreaField({ label, error, name, ...textarea }: TextAreaFieldProps) {
  return (
    <div className="mt-3">
      <label htmlFor={name} className="mb-1 block text-sm text-mute">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className="min-h-24 w-full resize-y rounded-[10px] border border-line bg-bg px-3 py-2.5 text-ink aria-invalid:border-err"
        {...textarea}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-err">
          {error}
        </p>
      )}
    </div>
  );
}

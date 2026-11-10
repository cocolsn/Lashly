"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import type { AuthState } from "./actions";

type AuthFormProps = {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: "new-password" | "current-password";
  passwordHint?: string;
};

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  passwordHint,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, {});

  if (state.notice) {
    return (
      <p role="status" className="rounded-card border border-line bg-ok p-4 text-ok-ink">
        {state.notice}
      </p>
    );
  }

  return (
    <form action={formAction} noValidate>
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.email}
      />
      <Field
        name="password"
        label="Mot de passe"
        type="password"
        autoComplete={passwordAutoComplete}
        required
        hint={passwordHint}
      />
      <p role="alert" className="mt-3 min-h-[1.5em] text-sm text-err">
        {state.error}
      </p>
      <div className="mt-2">
        <SubmitButton pendingLabel={pendingLabel}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

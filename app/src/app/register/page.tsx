"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { RegisterInputErrorCode } from "@/server/auth-rules";

type RegisterErrorCode = RegisterInputErrorCode | "emailTaken" | "passwordMismatch" | "generic";

// Sesja V6.1: rejestracja e-mail+hasło. Nie loguje sama — po utworzeniu konta wywołuje
// signIn("credentials"), żeby nie zmuszać użytkownika do ponownego wpisywania danych.
export default function RegisterPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const formId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<RegisterErrorCode[]>([]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors([]);

    if (password !== confirmPassword) {
      setErrors(["passwordMismatch"]);
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body: { errors?: RegisterInputErrorCode[] } = await response
        .json()
        .catch(() => ({}));
      setErrors(body.errors?.length ? body.errors : ["generic"]);
      setSubmitting(false);
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setSubmitting(false);
    if (result?.error) {
      // Rejestracja się udała, ale automatyczne logowanie nie — niech idzie zalogować
      // się ręcznie zamiast utknąć na tym ekranie.
      router.push("/login");
      return;
    }
    router.push("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("registerTitle")}</h1>

      <form
        onSubmit={handleSubmit}
        className={`flex flex-col gap-4 p-5 ${CARD_SURFACE_CLASS}`}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-email`} className="text-sm font-medium">
            {t("emailLabel")}
          </label>
          <Input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            required
            value={email}
            disabled={submitting}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-password`} className="text-sm font-medium">
            {t("passwordLabel")}
          </label>
          <Input
            id={`${formId}-password`}
            type="password"
            autoComplete="new-password"
            required
            value={password}
            disabled={submitting}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${formId}-confirm-password`} className="text-sm font-medium">
            {t("confirmPasswordLabel")}
          </label>
          <Input
            id={`${formId}-confirm-password`}
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            disabled={submitting}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>

        {errors.map((code) => (
          <p key={code} className="text-sm text-status-urgent">
            {t(`errors.${code}`)}
          </p>
        ))}

        <Button type="submit" disabled={submitting} className="w-full justify-center">
          {t("registerButton")}
        </Button>
      </form>

      <p className="text-center text-sm text-foreground/70">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-semibold underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

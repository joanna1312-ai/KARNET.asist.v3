"use client";

import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { CARD_SURFACE_CLASS } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

// Sesja V6.1: druga metoda logowania (e-mail+hasło) obok Google, na jednym ekranie —
// nie zastępuje jednoklikowego logowania Google, tylko dokłada opcję obok niego.
// `useSearchParams()` (odczyt `callbackUrl`) wymaga granicy Suspense w App Routerze,
// stąd rozbicie na zewnętrzny `LoginPage` i `LoginFormPanel`.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginFormPanel />
    </Suspense>
  );
}

function LoginFormPanel() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const formId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await signIn("credentials", { email, password, redirect: false });

    setSubmitting(false);
    if (result?.error) {
      setError(t("errors.invalidCredentials"));
      return;
    }
    router.push(callbackUrl);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>

      <div className={`flex flex-col gap-4 p-5 ${CARD_SURFACE_CLASS}`}>
        <Button
          type="button"
          variant="neutral"
          onClick={() => signIn("google", { callbackUrl })}
          className="w-full justify-center gap-2"
        >
          <LogIn className="size-4" aria-hidden />
          {t("googleButton")}
        </Button>

        <div className="flex items-center gap-3 text-xs text-foreground/50">
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          {t("orDivider")}
          <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              required
              value={password}
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-status-urgent">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {t("loginButton")}
          </Button>
        </form>
      </div>

      <p className="text-center text-sm text-foreground/70">
        {t("noAccountYet")}{" "}
        <Link href="/register" className="font-semibold underline">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}

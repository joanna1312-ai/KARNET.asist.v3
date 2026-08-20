import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { APP_VERSION } from "@/lib/app-version";

const CONTACT_EMAIL = "ai.joanna.dropia@gmail.com";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mx-auto mt-auto hidden w-full max-w-2xl shrink-0 border-t border-black/10 px-4 py-4 text-xs text-foreground/70 md:block dark:border-white/10">
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left">
        <Logo size="sm" />
        <p>{t("authorLine")}</p>
        <div className="flex items-center gap-1.5">
          <span>{t("contactLabel")}:</span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            aria-label={t("contactEmailAria", { email: CONTACT_EMAIL })}
            className="flex min-h-11 items-center underline hover:text-foreground"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <span>{t("versionLabel", { version: APP_VERSION })}</span>
      </div>
    </footer>
  );
}

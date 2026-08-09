import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";

const APP_VERSION = "v4_260809";
const CONTACT_EMAIL = "ai.joanna.dropia@gmail.com";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto shrink-0 border-t border-black/10 px-4 py-4 text-sm text-foreground/70 dark:border-white/10">
      <div className="mx-auto flex max-w-screen-lg flex-col items-center gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left">
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

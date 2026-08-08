import { getTranslations } from "next-intl/server";

const APP_VERSION = "v3_260808";
const CONTACT_EMAIL = "ai.joanna.dropia@gmail.com";

export async function Footer() {
  const tHeader = await getTranslations("header");
  const t = await getTranslations("footer");

  return (
    <footer className="mt-auto shrink-0 border-t border-black/10 px-4 py-4 text-sm text-foreground/70 dark:border-white/10">
      <div className="mx-auto flex max-w-screen-lg flex-col items-center gap-2 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:text-left">
        <div className="flex items-center gap-2">
          <span className="size-2.5 shrink-0 rounded-full bg-accent" />
          <span className="font-semibold text-foreground">{tHeader("brand")}</span>
        </div>
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

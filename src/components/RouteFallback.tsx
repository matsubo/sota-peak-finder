import { useTranslation } from "react-i18next";

/** Shown while a lazily-loaded route chunk is being fetched. */
export function RouteFallback() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center" role="status" aria-live="polite">
      <div className="font-mono-data text-teal-400 animate-pulse tracking-wider">
        {t("common.loading")}
      </div>
    </div>
  );
}

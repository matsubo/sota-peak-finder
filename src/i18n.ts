import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enTranslation from "./locales/en/translation.json";
// 翻訳リソースを直接インポート
import jaTranslation from "./locales/ja/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        translation: jaTranslation,
      },
      en: {
        translation: enTranslation,
      },
    },
    fallbackLng: "ja",
    supportedLngs: ["ja", "en"],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

/**
 * index.html hardcodes lang="en", so without this the document stays labelled
 * English even when Japanese is rendered. Screen readers pick pronunciation
 * from this attribute, and search engines use it to decide what they indexed.
 */
function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }
}

syncDocumentLanguage(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", syncDocumentLanguage);

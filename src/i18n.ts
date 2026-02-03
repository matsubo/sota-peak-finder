import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ja',
    supportedLngs: ['ja', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

// 翻訳ファイルを手動でロード
const loadTranslations = async () => {
  const ja = await fetch('/locales/ja/translation.json').then(res => res.json())
  const en = await fetch('/locales/en/translation.json').then(res => res.json())

  i18n.addResourceBundle('ja', 'translation', ja)
  i18n.addResourceBundle('en', 'translation', en)
}

loadTranslations()

export default i18n

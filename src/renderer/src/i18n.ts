import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

export function initI18n(lng?: string): typeof i18next {
  const instance = i18next.createInstance()
  instance.use(initReactI18next).init({
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: lng ?? 'fr',
    fallbackLng: 'fr',
    interpolation: { escapeValue: false }
  })
  return instance
}

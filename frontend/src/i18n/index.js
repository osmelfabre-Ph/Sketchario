import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import it from './locales/it.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    fallbackLng: 'it',
    supportedLngs: ['it', 'en', 'es', 'fr'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'sketchario_lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

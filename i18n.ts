import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization'; // or 'react-native-localize'
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import en from './locales/en.json';

export const resources = {
  ar: { translation: ar },
  fr: { translation: fr },
  en: { translation: en },
} as const;

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    lng: Localization?.locale?.split('-')[0], // e.g. 'en-US' -> 'en'
    fallbackLng: 'ar',
    resources,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

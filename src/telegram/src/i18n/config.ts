import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import am from "./locales/am.json";

export const STORAGE_KEY = "noah_lang";
export const LANGUAGES = ["en", "am"] as const;
export type Locale = (typeof LANGUAGES)[number];

export const defaultNS = "translation";

const resources = {
  en: { [defaultNS]: en as Record<string, unknown> },
  am: { [defaultNS]: am as Record<string, unknown> },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    ns: [defaultNS],
    fallbackLng: "en",
    supportedLngs: LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
    },
    react: {
      useSuspense: false,
    },
  });

i18n.on("languageChanged", (lng: string) => {
  const safe = LANGUAGES.includes(lng.split("-")[0] as Locale) ? lng.split("-")[0] : "en";
  if (typeof document !== "undefined") {
    document.documentElement.lang = safe === "am" ? "am" : "en";
  }
});
if (typeof document !== "undefined") {
  document.documentElement.lang = LANGUAGES.includes(i18n.language?.split("-")[0] as Locale) ? (i18n.language?.split("-")[0] ?? "en") : "en";
}

export function setLocale(lng: Locale): void {
  i18n.changeLanguage(lng);
}

export function getLocale(): Locale {
  const lng = i18n.language?.split("-")[0];
  return LANGUAGES.includes(lng as Locale) ? (lng as Locale) : "en";
}

export { i18n };

import color_mode_toggle from "@/locales/en/color_mode_toggle.json";
import footer from "@/locales/en/footer.json";
import header from "@/locales/en/header.json";
import landing_page from "@/locales/en/landing_page.json";
import messages from "@/locales/en/messages.json";
import second_page from "@/locales/en/second_page.json";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { LANGUAGES } from "./app.config";

const i18nInstance = i18n;

export const en = {
  color_mode_toggle,
  footer,
  header,
  landing_page,
  messages,
  second_page,
};

i18nInstance
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(Backend)
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    initAsync: false,
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    defaultNS: undefined,
    preload: ["en"],
    fallbackNS: undefined,
    debug: process.env.NODE_ENV === "development",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
  });

export default i18nInstance;

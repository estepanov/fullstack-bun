import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { LANGUAGES } from "./app.config";

const i18nInstance = i18n;

// Environment-based configuration
const isDevelopment: boolean = Boolean(import.meta.env.DEV);

// Load translations from imports - this ensures they're bundled and available immediately
// This prevents hydration mismatches by making translations available synchronously
const backend = resourcesToBackend((language: string, namespace: string) => {
  return import(`../locales/${language}/${namespace}.json`);
});

// Initialize i18n and wait for critical namespaces to load
const initPromise = i18nInstance
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(backend)
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    defaultNS: "common",
    ns: [
      "common",
      "color_mode_toggle",
      "footer",
      "header",
      "landing_page",
      "messages",
      "second_page",
    ],
    preload: ["en"], // Always preload English as fallback
    fallbackNS: "common",
    debug: isDevelopment,
    fallbackLng: "en",

    // Load translations lazily by default
    load: "languageOnly",

    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },

    // Improve performance with better caching
    cleanCode: true,

    // Configure React integration
    react: {
      useSuspense: true, // Use suspense to wait for translations to load
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "em"],
    },
  });

// Export a function to wait for i18n and critical namespaces to be loaded
export const waitForI18n = () => initPromise;

export default i18nInstance;

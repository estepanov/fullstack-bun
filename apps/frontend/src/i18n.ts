import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import { LANGUAGES } from "./app.config";

const i18nInstance = i18n;

// Environment-based configuration
const isDevelopment = import.meta.env.DEV;
const cdnBaseUrl = import.meta.env.VITE_I18N_CDN_URL || "";

// Configure the load path based on environment
function getLoadPath(): string {
  if (isDevelopment) {
    // In development, use the local dev server
    return "/locales/{{lng}}/{{ns}}.json";
  }
  
  if (cdnBaseUrl) {
    // In production with CDN, use the CDN URL
    return `${cdnBaseUrl}/locales/{{lng}}/{{ns}}.json`;
  }
  
  // In production without CDN, use the local build assets
  return "/locales/{{lng}}/{{ns}}.json";
}

// Namespaces that should be loaded immediately
const preloadNamespaces = [
  "common",
  "header",
  "footer", 
  "color_mode_toggle"
];

i18nInstance
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(Backend)
  .use(initReactI18next)
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    initAsync: true,
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    defaultNS: "common",
    ns: [
      "common",
      "color_mode_toggle",
      "footer",
      "header",
      "landing_page", 
      "messages",
      "second_page"
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
    
    backend: {
      loadPath: getLoadPath(),
      
      // Add request options for better error handling
      requestOptions: {
        cache: "default",
        credentials: "same-origin",
        mode: "cors",
      },
      
      // Configure retry logic for failed requests
      reloadInterval: false,
      
      // Add custom fetch options for CDN requests
      customHeaders: cdnBaseUrl ? {
        "Cache-Control": "public, max-age=3600", // 1 hour cache
      } : {},
    },
    
    // Improve performance with better caching
    cleanCode: true,
    
    // Configure React integration
    react: {
      useSuspense: true, // Enable suspense to wait for translations
      bindI18n: "languageChanged loaded",
      bindI18nStore: "added removed",
      transEmptyNodeValue: "",
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ["br", "strong", "i", "em"],
    },
  });

// Preload critical namespaces for better UX after initialization
i18nInstance.on('initialized', () => {
  const currentLng = i18nInstance.language || "en";
  for (const ns of preloadNamespaces) {
    i18nInstance.loadNamespaces(ns);
  }
});

export default i18nInstance;

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, type SupportedLanguage, type TranslationKey } from "./translations";

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem("agriverse_lang") || localStorage.getItem("agriverse_ai_lang");
    return saved === "te" || saved === "hi" || saved === "en" ? saved : "en";
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLangState(lang);
    localStorage.setItem("agriverse_lang", lang);
    localStorage.setItem("agriverse_ai_lang", lang);

    window.dispatchEvent(
      new CustomEvent("agriverse_language_changed", { detail: lang })
    );
  }, []);

  useEffect(() => {
    function handleEvent(e: Event) {
      const custom = e as CustomEvent<SupportedLanguage>;
      if (custom.detail && (custom.detail === "en" || custom.detail === "te" || custom.detail === "hi")) {
        setLangState(custom.detail);
      }
    }

    function handleStorage(e: StorageEvent) {
      if (e.key === "agriverse_lang" || e.key === "agriverse_ai_lang") {
        if (e.newValue === "en" || e.newValue === "te" || e.newValue === "hi") {
          setLangState(e.newValue);
        }
      }
    }

    window.addEventListener("agriverse_language_changed", handleEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("agriverse_language_changed", handleEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const t = useCallback(
    (key: TranslationKey | string, fallback?: string): string => {
      const langDict = translations[language] || translations.en;
      const val = (langDict as any)[key] || (translations.en as any)[key];
      return val || fallback || key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fallback if rendered outside provider
    const saved = (localStorage.getItem("agriverse_lang") as SupportedLanguage) || "en";
    const currentLang = saved === "te" || saved === "hi" || saved === "en" ? saved : "en";
    return {
      language: currentLang,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => {
        const langDict = translations[currentLang] || translations.en;
        return (langDict as any)[key] || (translations.en as any)[key] || fallback || key;
      },
    };
  }
  return ctx;
}


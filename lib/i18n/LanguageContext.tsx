"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GlobalLanguageBridge } from "./GlobalLanguageBridge";
import th from "./locales/th";
import en from "./locales/en";

type Language = "th" | "en";
export type Translations = typeof th;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("th");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("me_docflow_lang") as Language;
    if (savedLang && (savedLang === "th" || savedLang === "en")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("me_docflow_lang", lang);
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = language === "en" ? en : th;

  // We still provide context even before mount so that it doesn't break,
  // but it will use 'th' as default until hydration completes.
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className={!mounted ? "invisible" : ""}>
        <GlobalLanguageBridge language={language} />
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

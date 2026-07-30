"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { translations } from "@/lib/i18n/translations"

type Language = "vi" | "en"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (keyPath: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({
  children,
  initialLang = "vi",
}: {
  children: React.ReactNode
  initialLang?: Language
}) {
  const [language, setLanguageState] = useState<Language>(initialLang)

  useEffect(() => {
    // Read from localStorage on mount
    const savedLang = localStorage.getItem("lang") as Language
    if (savedLang === "vi" || savedLang === "en") {
      setLanguageState(savedLang)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("lang", lang)
    // Set a cookie so Server Components can read it
    document.cookie = `lang=${lang}; path=/; max-age=31536000` // 1 year
    // Refresh to apply language change globally across server/client components
    window.location.reload()
  }

  // Nested translation helper (e.g. t("nav.jobBoard"))
  const t = (keyPath: string): string => {
    if (!keyPath) return ""
    const keys = keyPath.split(".")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = translations[language]

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key]
      } else {
        return keyPath // Fallback to key if not found
      }
    }

    return typeof current === "string" ? current : keyPath
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, t, TranslationKey } from "@/lib/i18n";

interface LocaleContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error("useLocale must be used within a LocaleProvider");
    }
    return context;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("ja");

    useEffect(() => {
        const stored = localStorage.getItem("vision-locale") as Locale;
        if (stored && (stored === "ja" || stored === "en")) {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("vision-locale", newLocale);
    };

    const translate = (key: TranslationKey) => t(key, locale);

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t: translate }}>
            {children}
        </LocaleContext.Provider>
    );
}

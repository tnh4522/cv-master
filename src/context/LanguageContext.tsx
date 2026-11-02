import React, { createContext, useContext, useState, useMemo, useEffect, useRef } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { translations, type Language } from '@/lib/i18n';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'cv-master-lang';

function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function translate(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[lang] as unknown as Record<string, unknown>;
  const fallbackDict = translations.en as unknown as Record<string, unknown>;
  let str = resolvePath(dict, path) ?? resolvePath(fallbackDict, path) ?? path;

  if (params) {
    for (const [key, val] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
    }
  }
  return str;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (path, params) => translate('en', path, params),
});

export function getInitialLanguage(): Language {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    }
  } catch {
    // ignore storage errors
  }
  return 'en';
}

export function LanguageProvider({
  children,
  defaultLanguage,
}: {
  children: React.ReactNode;
  defaultLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(
    () => defaultLanguage ?? getInitialLanguage()
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = (nextLang: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
    setLanguageState(nextLang);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (path: string, params?: Record<string, string | number>) =>
        translate(language, path, params),
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs font-semibold uppercase"
        tooltipContent={t('header.languageTooltip')}
        data-testid="language-switcher"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{language.toUpperCase()}</span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-36 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            data-testid="lang-option-vi"
            onClick={() => {
              setLanguage('vi');
              setOpen(false);
            }}
            className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
              language === 'vi' ? 'bg-accent font-semibold' : ''
            }`}
          >
            <span className="mr-2">🇻🇳</span>
            <span>Tiếng Việt</span>
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="lang-option-en"
            onClick={() => {
              setLanguage('en');
              setOpen(false);
            }}
            className={`flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
              language === 'en' ? 'bg-accent font-semibold' : ''
            }`}
          >
            <span className="mr-2">🇺🇸</span>
            <span>English</span>
          </button>
        </div>
      )}
    </div>
  );
}

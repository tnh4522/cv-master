import React, { useState, useEffect, useRef } from 'react';
import { FileText, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { useResumeStore } from '@/store/useResumeStore';

interface CvLanguageSelectorProps {
  onOpenTranslateDialog: () => void;
}

export function CvLanguageSelector({
  onOpenTranslateDialog,
}: CvLanguageSelectorProps) {
  const { resumeData, setCvLanguage } = useResumeStore();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const currentCvLang = resumeData.cvLanguage || 'en';

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

  const handleSelectLanguage = (targetLang: 'en' | 'vi') => {
    setCvLanguage(targetLang);
    setOpen(false);
    toast({
      title: t('header.cvLanguagePopoverTitle'),
      description:
        targetLang === 'vi'
          ? t('header.switchedCvToViToast')
          : t('header.switchedCvToEnToast'),
    });
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 px-2.5 text-xs font-medium"
        tooltipContent={t('header.cvLanguageTooltip')}
        aria-expanded={open}
        aria-haspopup="menu"
        data-testid="cv-language-selector"
        onClick={() => setOpen((prev) => !prev)}
      >
        <FileText className="h-3.5 w-3.5 text-primary" />
        <span className="hidden sm:inline font-semibold text-muted-foreground">
          {t('header.cvLanguage')}:
        </span>
        <span className="font-semibold text-foreground">
          {currentCvLang === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
        </span>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <div className="border-b border-border/60 px-2.5 py-1.5 text-left">
            <div className="text-xs font-semibold text-foreground">
              {t('header.cvLanguagePopoverTitle')}
            </div>
            <div className="text-[10px] leading-tight text-muted-foreground">
              {t('header.cvLanguagePopoverDesc')}
            </div>
          </div>

          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              data-testid="cv-lang-option-vi"
              onClick={() => handleSelectLanguage('vi')}
              className={`flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                currentCvLang === 'vi' ? 'bg-accent/60 font-semibold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇻🇳</span>
                <span>Tiếng Việt</span>
              </div>
              {currentCvLang === 'vi' && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>

            <button
              type="button"
              role="menuitem"
              data-testid="cv-lang-option-en"
              onClick={() => handleSelectLanguage('en')}
              className={`flex w-full cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${
                currentCvLang === 'en' ? 'bg-accent/60 font-semibold' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇺🇸</span>
                <span>English</span>
              </div>
              {currentCvLang === 'en' && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          </div>

          <div className="border-t border-border/60 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenTranslateDialog();
              }}
              className="flex w-full cursor-pointer items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{t('header.translateCv')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

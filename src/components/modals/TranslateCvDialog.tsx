import React, { useState } from 'react';
import { Languages, Sparkles, Loader2, Check } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { useResumeStore } from '@/store/useResumeStore';
import { translateResume } from '@/services/aiService';

export interface TranslateCvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTargetLang?: 'en' | 'vi';
}

export function TranslateCvDialog({
  open,
  onOpenChange,
  initialTargetLang,
}: TranslateCvDialogProps) {
  const { resumeData, setResumeData, setCvLanguage } = useResumeStore();
  const { language, t } = useLanguage();

  const currentCvLang: 'en' | 'vi' = resumeData.cvLanguage || 'en';
  const defaultTarget: 'en' | 'vi' =
    initialTargetLang || (currentCvLang === 'vi' ? 'en' : 'vi');

  const [targetLang, setTargetLang] = useState<'en' | 'vi'>(defaultTarget);
  const [isTranslating, setIsTranslating] = useState(false);

  // Keep target updated when opening
  React.useEffect(() => {
    if (open) {
      setTargetLang(
        initialTargetLang || (currentCvLang === 'vi' ? 'en' : 'vi')
      );
    }
  }, [open, initialTargetLang, currentCvLang]);

  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      const translated = await translateResume(resumeData, targetLang);
      setResumeData(translated);
      setCvLanguage(targetLang);

      const langLabel =
        targetLang === 'vi' ? t('translate.vietnamese') : t('translate.english');

      toast({
        title: t('translate.successTitle'),
        description: t('translate.successDesc', { lang: langLabel }),
      });

      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        title: t('translate.failedTitle'),
        description: t('translate.failedDesc'),
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSetLanguageOnly = () => {
    setCvLanguage(targetLang);
    toast({
      title: t('header.cvLanguagePopoverTitle'),
      description:
        targetLang === 'vi'
          ? t('header.switchedCvToViToast')
          : t('header.switchedCvToEnToast'),
    });
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isTranslating) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <span>{t('translate.dialogTitle')}</span>
          </DialogTitle>
          <DialogDescription>{t('translate.dialogDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Target Language Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">
              {t('translate.selectTargetLang')}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTargetLang('vi')}
                className={`relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                  targetLang === 'vi'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-accent/40'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl">🇻🇳</span>
                  {targetLang === 'vi' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-xs text-foreground">
                  Tiếng Việt
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Vietnamese
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetLang('en')}
                className={`relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                  targetLang === 'en'
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border bg-card hover:bg-accent/40'
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xl">🇺🇸</span>
                  {targetLang === 'en' && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <div className="font-semibold text-xs text-foreground">
                  English
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Tiếng Anh
                </div>
              </button>
            </div>
          </div>

          {/* UI Language Independence Notice */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs">
            <div className="font-medium text-foreground">
              {t('header.uiLanguage')}:{' '}
              {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇺🇸 English'}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {language === 'vi'
                ? 'Ngôn ngữ giao diện hệ thống (nút bấm, menu) hoàn toàn độc lập và không bị thay đổi khi dịch CV. Bạn có thể đổi giao diện ở nút 🌐 trên thanh tiêu đề.'
                : 'System display language is completely independent and will not be changed when translating the CV. You can change UI language via the 🌐 button on the header.'}
            </p>
          </div>

          {/* Translation Details Box */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {targetLang === 'vi'
                  ? 'AI sẽ dịch và phản hồi bằng Tiếng Việt'
                  : 'AI will translate & respond in English'}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed">
              {t('translate.translateNotice')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            disabled={isTranslating}
            onClick={handleSetLanguageOnly}
          >
            {targetLang === 'vi'
              ? 'Chỉ đổi ngôn ngữ CV & AI (không dịch đè nội dung)'
              : 'Set CV & AI language only (no full translation)'}
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isTranslating}
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="gap-1.5 text-xs font-medium"
              disabled={isTranslating}
              onClick={handleTranslate}
            >
              {isTranslating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{t('translate.translating')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{t('translate.translateBtn')}</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { Suspense, lazy, useState } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Slider,
  Switch,
} from '@/components/ui/primitives';
import { FontPicker } from '@/components/controls/FontPicker';
import { toast } from '@/components/ui/toast';
import { TranslateCvDialog } from '@/components/modals/TranslateCvDialog';
import { CONFIG, resolveMargins } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';
import { usePdfSettingsStore, useResumeStore } from '@/store/useResumeStore';
import type { SkillsLayoutType } from '@/types/resume';

const MARGIN_SIDES = [
  { key: 'top', field: 'TOP', labelKey: 'controls.marginTop' },
  { key: 'bottom', field: 'BOTTOM', labelKey: 'controls.marginBottom' },
  { key: 'left', field: 'LEFT', labelKey: 'controls.marginLeft' },
  { key: 'right', field: 'RIGHT', labelKey: 'controls.marginRight' },
] as const;

const DndSections = lazy(() => import('@/components/controls/DndSections'));

export interface ControlsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ControlsSheet({ open, onOpenChange }: ControlsSheetProps) {
  const { resumeData, setCvLanguage, updateBasics, resetSectionOrder } =
    useResumeStore();
  const { pdfSettings, updatePdfSettings, resetPdfSettings } =
    usePdfSettingsStore();
  const { t } = useLanguage();
  const [translateOpen, setTranslateOpen] = useState(false);

  const { alignment } = resumeData.basics;
  const margins = resolveMargins(pdfSettings.margin);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border px-6 py-4">
            <div className="flex items-center justify-between pr-6">
              <div>
                <SheetTitle>{t('controls.title')}</SheetTitle>
                <SheetDescription>
                  {t('controls.description')}
                </SheetDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  resetPdfSettings();
                  resetSectionOrder();
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t('common.reset')}</span>
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            <Accordion
              type="multiple"
              defaultValue={['language', 'layout', 'sections', 'typography', 'page']}
              className="w-full"
            >
              {/* 0. CV & AI Language */}
              <AccordionItem value="language">
                <AccordionTrigger className="text-sm font-semibold">
                  {t('controls.cvLanguage')}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <Label className="text-xs">
                        {t('translate.selectTargetLang')}
                      </Label>
                      <span className="font-semibold text-primary">
                        {resumeData.cvLanguage === 'vi'
                          ? '🇻🇳 Tiếng Việt'
                          : '🇺🇸 English'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={
                          resumeData.cvLanguage === 'vi'
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => {
                          setCvLanguage('vi');
                          toast({
                            title: t('header.cvLanguagePopoverTitle'),
                            description: t('header.switchedCvToViToast'),
                          });
                        }}
                      >
                        <span>🇻🇳</span>
                        <span>Tiếng Việt</span>
                      </Button>
                      <Button
                        type="button"
                        variant={
                          resumeData.cvLanguage !== 'vi'
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => {
                          setCvLanguage('en');
                          toast({
                            title: t('header.cvLanguagePopoverTitle'),
                            description: t('header.switchedCvToEnToast'),
                          });
                        }}
                      >
                        <span>🇺🇸</span>
                        <span>English</span>
                      </Button>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      {t('controls.cvLanguageDesc')}
                    </p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground/80 italic">
                      {t('header.uiLanguagePopoverDesc')}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs font-medium text-primary border-primary/30 hover:bg-primary/5"
                    onClick={() => setTranslateOpen(true)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t('controls.translateCvBtn')}</span>
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* 1. Layout & Alignment */}
            <AccordionItem value="layout">
              <AccordionTrigger className="text-sm font-semibold">
                {t('controls.layoutAndAlignment')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">
                    {t('controls.personalInfoAlignment')}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={alignment === 'start' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'start' })}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span>{t('controls.left')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={alignment === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'center' })}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                      <span>{t('controls.center')}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={alignment === 'end' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'end' })}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                      <span>{t('controls.right')}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">{t('controls.skillsLayout')}</Label>
                  <RadioGroup
                    value={pdfSettings.skillsLayout}
                    onValueChange={(val) =>
                      updatePdfSettings({
                        skillsLayout: val as SkillsLayoutType,
                      })
                    }
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="inline" id="skills-inline" />
                      <Label
                        htmlFor="skills-inline"
                        className="cursor-pointer text-xs font-normal"
                      >
                        {t('controls.inline')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="grid-col" id="skills-grid-col" />
                      <Label
                        htmlFor="skills-grid-col"
                        className="cursor-pointer text-xs font-normal"
                      >
                        {t('controls.gridCol')}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="grid-row" id="skills-grid-row" />
                      <Label
                        htmlFor="skills-grid-row"
                        className="cursor-pointer text-xs font-normal"
                      >
                        {t('controls.gridRow')}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Section Order (Drag and Drop) */}
            <AccordionItem value="sections">
              <AccordionTrigger className="text-sm font-semibold">
                {t('controls.reorderSections')}
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <Suspense
                  fallback={
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  }
                >
                  <DndSections />
                </Suspense>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Typography */}
            <AccordionItem value="typography">
              <AccordionTrigger className="text-sm font-semibold">
                {t('controls.typography')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <FontPicker />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">{t('controls.fontSize')}</Label>
                    <span className="text-muted-foreground">
                      {pdfSettings.fontSize}px
                    </span>
                  </div>
                  <Slider
                    min={12}
                    max={18}
                    step={1}
                    value={[pdfSettings.fontSize]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ fontSize: val })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">{t('controls.lineHeight')}</Label>
                    <span className="text-muted-foreground">
                      {(pdfSettings.lineHeight * 0.25).toFixed(2)}rem
                    </span>
                  </div>
                  <Slider
                    min={4}
                    max={10}
                    step={1}
                    value={[pdfSettings.lineHeight]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ lineHeight: val })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">
                      {t('controls.verticalSpacing')}
                    </Label>
                    <span className="text-muted-foreground">
                      {pdfSettings.verticalSpacing}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[pdfSettings.verticalSpacing]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ verticalSpacing: val })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Page & Margins */}
            <AccordionItem value="page">
              <AccordionTrigger className="text-sm font-semibold">
                {t('controls.pageSetup')}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                {MARGIN_SIDES.map(({ key, field, labelKey }) => {
                  const value = margins[key];
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Label className="text-xs">{t(labelKey)}</Label>
                        <span className="text-muted-foreground">{value}px</span>
                      </div>
                      <Slider
                        aria-label={t(labelKey)}
                        min={CONFIG.MARGIN.MIN}
                        max={CONFIG.MARGIN.MAX}
                        step={CONFIG.MARGIN.STEP}
                        value={[value]}
                        onValueChange={([val]) =>
                          updatePdfSettings({
                            margin: {
                              ...pdfSettings.margin,
                              [field]: val,
                            },
                          })
                        }
                      />
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="page-break-switch"
                      className="cursor-pointer text-xs font-medium"
                    >
                      {t('controls.showPageBreak')}
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      {t('controls.showPageBreakDesc')}
                    </p>
                  </div>
                  <Switch
                    id="page-break-switch"
                    checked={pdfSettings.pageBreakLine}
                    onCheckedChange={(checked) =>
                      updatePdfSettings({ pageBreakLine: checked })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
    <TranslateCvDialog
      open={translateOpen}
      onOpenChange={setTranslateOpen}
    />
  </>
  );
}

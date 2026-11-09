import React, { useEffect, useState } from 'react';
import { Pencil, Check, Eye, EyeOff, FileDown } from 'lucide-react';
import { Button, Input, Separator } from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { ExportSectionJsonDialog } from '@/components/modals/ExportSectionJsonDialog';
import { useLanguage } from '@/context/LanguageContext';
import { useResumeStore } from '@/store/useResumeStore';

export function SummaryEditor() {
  const {
    resumeData,
    hiddenSections,
    updateSummary,
    updateSectionTitle,
    toggleHideSection,
  } = useResumeStore();
  const { t } = useLanguage();
  const isSectionHidden = hiddenSections.includes('summary');
  const currentContent = resumeData.summary.content;
  const currentTitle =
    resumeData.sectionTitles.summary ||
    resumeData.summary.sectionTitle ||
    'Summary';

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(currentTitle);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(currentTitle);
    }
  }, [currentTitle, isEditingTitle]);

  const handleSaveTitle = () => {
    const trimmed = titleDraft.trim() || 'Summary';
    updateSectionTitle('summary', trimmed);
    setTitleDraft(trimmed);
    setIsEditingTitle(false);
  };

  return (
    <section id="section-summary" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SectionIcon section="summary" className="h-5 w-5 text-primary" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                }}
                className="h-8 w-56 text-sm font-bold"
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSaveTitle}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-1.5">
              <h2 className="text-lg font-bold tracking-tight">
                {currentTitle}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-60 group-hover:opacity-100"
                tooltipContent={t('common.renameSection')}
                onClick={() => {
                  setTitleDraft(currentTitle);
                  setIsEditingTitle(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-testid="export-section-json-btn-summary"
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            tooltipContent={t('common.exportSectionJsonTooltip')}
            onClick={() => setIsExportDialogOpen(true)}
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('common.exportJson')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 px-2.5 text-xs ${
              isSectionHidden
                ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            tooltipContent={
              isSectionHidden
                ? t('common.showSectionTooltip')
                : t('common.hideSectionTooltip')
            }
            onClick={() => toggleHideSection('summary')}
          >
            {isSectionHidden ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>{t('common.sectionHidden')}</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.hideSection')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isSectionHidden && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleHideSection('summary')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleHideSection('summary');
            }
          }}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
        >
          <div className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            <span>{t('common.sectionHiddenBanner')}</span>
          </div>
          <span className="ml-2 shrink-0 font-semibold underline underline-offset-2">
            {t('common.showSection')}
          </span>
        </div>
      )}

      <RichTextEditor
        content={currentContent}
        onUpdate={(html) => updateSummary(html)}
      />

      <ExportSectionJsonDialog
        sectionKey="summary"
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
      />

      <Separator className="my-4" />
    </section>
  );
}

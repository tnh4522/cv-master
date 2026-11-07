import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Upload,
  GitMerge,
  RotateCcw,
  Languages,
} from 'lucide-react';
import {
  Button,
  DeleteConfirmDialog,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { DownloadDialog } from '@/components/modals/DownloadDialog';
import { ImportDialog } from '@/components/modals/ImportDialog';
import { MergeCvDialog } from '@/components/modals/MergeCvDialog';
import { AiReviewDialog } from '@/components/modals/AiReviewDialog';
import { TranslateCvDialog } from '@/components/modals/TranslateCvDialog';
import { CvLanguageSelector } from '@/components/layout/CvLanguageSelector';
import { LanguageSwitcher, useLanguage } from '@/context/LanguageContext';
import {
  usePdfSettingsStore,
  useResumeStore,
  useReviewStore,
} from '@/store/useResumeStore';

export function Header() {
  const { resetResume } = useResumeStore();
  const { resetPdfSettings } = usePdfSettingsStore();
  const { clearAnalysis } = useReviewStore();
  const { t } = useLanguage();

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleResetAll = () => {
    resetResume();
    resetPdfSettings();
    clearAnalysis();
    setConfirmResetOpen(false);
    toast({
      title: t('header.resetToastTitle'),
      description: t('header.resetToastDesc'),
    });
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90"
        >
          <img
            src="/logo.svg"
            alt="CV Master Logo"
            className="h-7 w-7 rounded-md"
          />
          <span className="text-base font-bold tracking-tight">CV Master</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="shiny"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs"
            onClick={() => setAiReviewOpen(true)}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('header.aiReview')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            tooltipContent={t('header.downloadTooltip')}
            onClick={() => setDownloadOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('header.download')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            tooltipContent={t('header.importTooltip')}
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('header.import')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="header-merge-cv-btn"
            className="h-8 gap-1.5 px-2.5 text-xs"
            tooltipContent={t('header.mergeCvTooltip')}
            onClick={() => setMergeOpen(true)}
          >
            <GitMerge className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('header.mergeCv')}</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs font-medium text-primary hover:bg-primary/5"
            tooltipContent={t('header.translateCvTooltip')}
            onClick={() => setTranslateOpen(true)}
          >
            <Languages className="h-3.5 w-3.5" />
            <span className="hidden md:inline">{t('header.translateCv')}</span>
          </Button>

          <CvLanguageSelector
            onOpenTranslateDialog={() => setTranslateOpen(true)}
          />

          <LanguageSwitcher />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            tooltipContent={t('header.resetTooltip')}
            onClick={() => setConfirmResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <DownloadDialog open={downloadOpen} onOpenChange={setDownloadOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <MergeCvDialog open={mergeOpen} onOpenChange={setMergeOpen} />
      <AiReviewDialog open={aiReviewOpen} onOpenChange={setAiReviewOpen} />
      <TranslateCvDialog open={translateOpen} onOpenChange={setTranslateOpen} />

      <DeleteConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title={t('header.resetConfirmTitle')}
        description={t('header.resetConfirmDesc')}
        cancelText={t('common.cancel')}
        confirmText={t('common.reset')}
        onConfirm={handleResetAll}
      />
    </>
  );
}

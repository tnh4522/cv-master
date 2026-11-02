import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  FileDown,
  FileJson,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import { useLanguage } from '@/context/LanguageContext';
import { usePdfSettingsStore, useResumeStore } from '@/store/useResumeStore';
import {
  exportResumeToPdf,
  formatExportFilename,
  validateBasicsForPdfExport,
} from '@/services/pdfService';

export interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportStatus = 'idle' | 'generating' | 'completed';

export function DownloadDialog({ open, onOpenChange }: DownloadDialogProps) {
  const { resumeData, sectionOrder, hiddenItemIds, hiddenSections } =
    useResumeStore();
  const { pdfSettings } = usePdfSettingsStore();
  const { t } = useLanguage();
  const printSheetRef = useRef<HTMLDivElement | null>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');

  const handleDownloadJson = () => {
    try {
      const payload = {
        ...resumeData,
        sectionOrder,
        hiddenItemIds,
        hiddenSections,
        pdfSettings,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = formatExportFilename(resumeData.basics, 'json');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: t('download.jsonExportedTitle'),
        description: t('download.jsonExportedDesc'),
      });
      onOpenChange(false);
    } catch {
      toast({
        variant: 'destructive',
        title: t('download.exportFailedTitle'),
        description: t('download.exportFailedDesc'),
      });
    }
  };

  const handleDownloadPdf = async () => {
    // 1. Validate required basics fields (`name`, `title`, `email`)
    const check = validateBasicsForPdfExport(resumeData.basics);
    if (!check.valid) {
      toast({
        variant: 'destructive',
        title: t('download.incompleteInfoTitle'),
        description: check.error,
      });
      return;
    }

    const sheetEl =
      printSheetRef.current ||
      (document.querySelector('.resume-sheet') as HTMLElement | null);

    if (!sheetEl) {
      toast({
        variant: 'destructive',
        title: t('download.previewNotReadyTitle'),
        description: t('download.previewNotReadyDesc'),
      });
      return;
    }

    try {
      setExportStatus('generating');
      const fileName = formatExportFilename(resumeData.basics, 'pdf');
      await exportResumeToPdf({
        resumeSheetElement: sheetEl,
        pdfSettings,
        fileName,
      });
      setExportStatus('completed');
      toast({
        title: t('download.pdfDownloaded'),
        description: t('download.pdfSavedDesc', { fileName }),
      });
      setTimeout(() => {
        setExportStatus('idle');
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      setExportStatus('idle');
      toast({
        variant: 'destructive',
        title: t('download.pdfFailedTitle'),
        description:
          err instanceof Error ? err.message : t('richText.tryAgainDesc'),
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (exportStatus === 'generating') return;
        setExportStatus('idle');
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('download.title')}</DialogTitle>
          <DialogDescription>
            {t('download.description')}
          </DialogDescription>
        </DialogHeader>

        {exportStatus === 'generating' ? (
          /* GeneratingPdfOverlay (`Gp`) */
          <div
            data-testid="pdf-generating-state"
            className="flex flex-col items-center justify-center gap-3 py-8 text-center"
          >
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
            <p className="text-sm font-semibold">{t('download.generatingPdf')}</p>
            <p className="text-xs text-muted-foreground">
              {t('download.generatingPdfDesc')}
            </p>
          </div>
        ) : exportStatus === 'completed' ? (
          /* PdfSuccessOverlay (`Wp`) */
          <div
            data-testid="pdf-completed-state"
            className="flex flex-col items-center justify-center gap-3 py-8 text-center"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-semibold">{t('download.pdfDownloaded')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 py-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-start gap-3.5 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('download.pdfOptionTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('download.pdfOptionDesc')}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex items-start gap-3.5 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileJson className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('download.jsonOptionTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('download.jsonOptionDesc')}
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Hidden print-mode sheet for clean PDF capture without page-break overlays */}
        <div className="hidden-fix" aria-hidden="true">
          <ResumeSheet ref={printSheetRef} mode="print" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

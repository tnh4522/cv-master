import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  Button,
  DeleteConfirmDialog,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { DownloadDialog } from '@/components/modals/DownloadDialog';
import { ImportDialog } from '@/components/modals/ImportDialog';
import { AiReviewDialog } from '@/components/modals/AiReviewDialog';
import {
  usePdfSettingsStore,
  useResumeStore,
  useReviewStore,
} from '@/store/useResumeStore';

export function Header() {
  const { resetResume } = useResumeStore();
  const { resetPdfSettings } = usePdfSettingsStore();
  const { clearAnalysis } = useReviewStore();

  const [downloadOpen, setDownloadOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [aiReviewOpen, setAiReviewOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleResetAll = () => {
    resetResume();
    resetPdfSettings();
    clearAnalysis();
    setConfirmResetOpen(false);
    toast({
      title: 'Workspace reset',
      description: 'All CV data and settings have been restored to defaults.',
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
            <span>AI CV Review</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            tooltipContent="Download PDF or JSON"
            onClick={() => setDownloadOpen(true)}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            tooltipContent="Import CV"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            tooltipContent="Reset to default CV"
            onClick={() => setConfirmResetOpen(true)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <DownloadDialog open={downloadOpen} onOpenChange={setDownloadOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <AiReviewDialog open={aiReviewOpen} onOpenChange={setAiReviewOpen} />

      <DeleteConfirmDialog
        open={confirmResetOpen}
        onOpenChange={setConfirmResetOpen}
        title="Reset all CV data?"
        description="This will replace your current CV and styling settings with the default template. Export a JSON backup first if you want to keep your changes."
        onConfirm={handleResetAll}
      />
    </>
  );
}

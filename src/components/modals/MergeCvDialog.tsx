import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  GitMerge,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import {
  DEFAULT_SECTION_ORDER,
  useResumeStore,
} from '@/store/useResumeStore';
import {
  isDefaultTemplateBasics,
  mergeMultipleResumes,
  parseCvJsonForMerge,
} from '@/services/mergeService';
import type { ResumeData, SectionKey } from '@/types/resume';

export interface MergeCvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UploadedCvFileItem {
  id: string;
  fileName: string;
  candidateName: string;
  data: Partial<ResumeData>;
}

function readFileAsText(file: File): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read JSON file'));
    reader.readAsText(file);
  });
}

export function MergeCvDialog({ open, onOpenChange }: MergeCvDialogProps) {
  const { resumeData, mergeMultipleResumeData } = useResumeStore();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedCvFileItem[]>([]);
  const [replaceDefaults, setReplaceDefaults] = useState<boolean>(() =>
    isDefaultTemplateBasics(resumeData.basics)
  );
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (open) {
      setReplaceDefaults(isDefaultTemplateBasics(resumeData.basics));
    }
  }, [open, resumeData.basics]);

  const resetState = () => {
    setUploadedFiles([]);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setErrorMessage('');
    const newItems: UploadedCvFileItem[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith('.json') && file.type !== 'application/json') {
        errors.push(`${file.name}: Only .json files are supported.`);
        continue;
      }

      try {
        const rawText = await readFileAsText(file);
        const parsedData = parseCvJsonForMerge(rawText);
        const candidateName =
          parsedData.basics?.name?.trim() ||
          parsedData.basics?.title?.trim() ||
          file.name.replace(/\.json$/i, '');

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          fileName: file.name,
          candidateName,
          data: parsedData,
        });
      } catch (err) {
        errors.push(
          `${file.name}: ${
            err instanceof Error ? err.message : 'Invalid CV JSON format.'
          }`
        );
      }
    }

    if (newItems.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newItems]);
    }
    if (errors.length > 0) {
      setErrorMessage(errors.join(' '));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    await processFiles(e.target.files);
  };

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
    setErrorMessage('');
  };

  const mergePreview = useMemo(() => {
    if (uploadedFiles.length === 0) return null;
    return mergeMultipleResumes(
      resumeData,
      uploadedFiles.map((f) => f.data),
      { replaceDefaultPlaceholders: replaceDefaults }
    );
  }, [resumeData, uploadedFiles, replaceDefaults]);

  const handleConfirmMerge = () => {
    if (uploadedFiles.length === 0) return;

    const result = mergeMultipleResumeData(
      uploadedFiles.map((f) => f.data),
      { replaceDefaultPlaceholders: replaceDefaults }
    );

    const { summary } = result;
    const basicsCount =
      summary.filledBasicsFields.length + (summary.summaryUpdated ? 1 : 0);

    if (summary.hasAnyChanges) {
      toast({
        title: t('merge.mergedSuccessTitle'),
        description: t('merge.mergedSuccessDesc', {
          files: uploadedFiles.length,
          added: summary.totalAddedItems,
          updated: summary.totalUpdatedItems,
          basics: basicsCount,
        }),
      });
    } else {
      toast({
        title: t('merge.mergedNoChangesTitle'),
        description: t('merge.mergedNoChangesDesc'),
      });
    }

    resetState();
    onOpenChange(false);
  };

  const changedSections: SectionKey[] = useMemo(() => {
    if (!mergePreview) return [];
    return DEFAULT_SECTION_ORDER.filter((key) => {
      if (key === 'summary') return false;
      const st = mergePreview.summary.sectionStats[key];
      return st.addedCount > 0 || st.updatedCount > 0;
    });
  }, [mergePreview]);

  const basicsAndSummaryFields = useMemo(() => {
    if (!mergePreview) return [];
    const fields = [...mergePreview.summary.filledBasicsFields];
    if (mergePreview.summary.summaryUpdated && !fields.includes('summary')) {
      fields.push('summary');
    }
    return fields;
  }, [mergePreview]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetState();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            <span>{t('merge.title')}</span>
          </DialogTitle>
          <DialogDescription>{t('merge.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Dropzone */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              multiple
              className="hidden"
              data-testid="merge-file-input"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer?.files?.length) {
                  void processFiles(e.dataTransfer.files);
                }
              }}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-5 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileJson className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{t('merge.dropzoneTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('merge.dropzoneSub')}
                </p>
              </div>
            </button>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  {t('merge.uploadedFilesLabel', {
                    count: uploadedFiles.length,
                  })}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={resetState}
                >
                  {t('merge.clearAll')}
                </Button>
              </div>

              <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
                {uploadedFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    data-testid={`merge-uploaded-file-${idx}`}
                    className="flex items-center justify-between rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileJson className="h-4 w-4 shrink-0 text-primary" />
                      <div className="truncate">
                        <span className="font-medium">{item.fileName}</span>
                        {item.candidateName && (
                          <span className="ml-1.5 text-muted-foreground">
                            ({item.candidateName})
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={t('merge.removeFile')}
                      onClick={() => handleRemoveFile(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Option to overwrite untouched default template placeholders */}
          {uploadedFiles.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
              <Checkbox
                id="merge-replace-defaults"
                checked={replaceDefaults}
                onCheckedChange={(checked) =>
                  setReplaceDefaults(Boolean(checked))
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5 leading-none">
                <Label
                  htmlFor="merge-replace-defaults"
                  className="cursor-pointer text-xs font-medium"
                >
                  {t('merge.replaceDefaultLabel')}
                </Label>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('merge.replaceDefaultDesc')}
                </p>
              </div>
            </div>
          )}

          {/* Live Merge Preview */}
          {mergePreview && (
            <div
              data-testid="merge-preview-panel"
              className="space-y-2.5 rounded-lg border border-primary/25 bg-primary/5 p-3.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t('merge.previewTitle')}</span>
              </div>

              {!mergePreview.summary.hasAnyChanges ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-background/80 p-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{t('merge.noChangesBanner')}</span>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {basicsAndSummaryFields.length > 0 && (
                    <div className="space-y-1 rounded-md border border-border/60 bg-background/90 p-2.5">
                      <p className="font-medium text-foreground">
                        {t('merge.basicsFilledLabel', {
                          count: basicsAndSummaryFields.length,
                        })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {basicsAndSummaryFields.map((field) => (
                          <span
                            key={field}
                            className="inline-flex items-center rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                          >
                            +{field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {changedSections.length > 0 && (
                    <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                      {changedSections.map((secKey) => {
                        const stat = mergePreview.summary.sectionStats[secKey];
                        const secTitle =
                          resumeData.sectionTitles[secKey] || secKey;
                        return (
                          <div
                            key={secKey}
                            className="flex flex-col gap-1 rounded-md border border-border/60 bg-background/90 px-2.5 py-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">
                                {secTitle}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {stat.addedCount > 0 && (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                    <Plus className="h-2.5 w-2.5" />
                                    {t('merge.newItemsBadge', {
                                      count: stat.addedCount,
                                    }).replace(/^\+/, '')}
                                  </span>
                                )}
                                {stat.updatedCount > 0 && (
                                  <span className="inline-flex items-center rounded bg-blue-500/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300">
                                    {t('merge.updatedItemsBadge', {
                                      count: stat.updatedCount,
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                            {(stat.addedNames.length > 0 ||
                              stat.updatedNames.length > 0) && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {[...stat.addedNames, ...stat.updatedNames].join(
                                  ', '
                                )}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={uploadedFiles.length === 0}
            onClick={handleConfirmMerge}
            data-testid="confirm-merge-cv-btn"
            className="gap-1.5"
          >
            <GitMerge className="h-4 w-4" />
            <span>{t('merge.mergeBtn')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

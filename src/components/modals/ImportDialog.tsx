import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileJson,
  FileText,
  Image as ImageIcon,
  Loader2,
  Upload,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { usePdfSettingsStore, useResumeStore } from '@/store/useResumeStore';
import { cvMasterJsonSchema } from '@/schemas/resumeSchemas';
import {
  extractTextFromPdfFile,
  parseImageResumeFile,
  parsePdfResumeText,
  validateImageImportFile,
  validatePdfImportFile,
} from '@/services/importService';
import type { PdfSettings, ResumeData, SectionKey } from '@/types/resume';

export type ImportFormatType = 'pdf' | 'image' | 'cv-master-json' | 'json';

export interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const { setResumeData, setHiddenItemIds, updateSectionOrder } =
    useResumeStore();
  const { updatePdfSettings } = usePdfSettingsStore();
  const { t } = useLanguage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<ImportFormatType>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [pdfPreviewText, setPdfPreviewText] = useState<string>('');
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);

  // Two-step JSON validation state (`df` -> `uf`)
  const [isJsonValidated, setIsJsonValidated] = useState(false);
  const [validatedJsonPayload, setValidatedJsonPayload] = useState<{
    resumeData: ResumeData;
    pdfSettings: PdfSettings;
    hiddenItemIds: string[];
    sectionOrder?: SectionKey[];
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);

  const resetState = (nextFormat: ImportFormatType = format) => {
    setFormat(nextFormat);
    setSelectedFile(null);
    setExtractedPdfText('');
    setPdfPreviewText('');
    setIsExtractingPdf(false);
    setIsJsonValidated(false);
    setValidatedJsonPayload(null);
    setErrorMessage('');
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getAcceptAttribute = (fmt: ImportFormatType): string => {
    switch (fmt) {
      case 'pdf':
        return '.pdf,application/pdf';
      case 'image':
        return '.png,.jpg,.jpeg,image/png,image/jpeg';
      case 'cv-master-json':
        return '.json,application/json';
      default:
        return '';
    }
  };

  const validateJsonFile = async (file: File) => {
    setErrorMessage('');
    try {
      const rawText =
        typeof file.text === 'function'
          ? await file.text()
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result || ''));
              reader.onerror = () => reject(new Error('Failed to read JSON'));
              reader.readAsText(file);
            });

      const parsedJson = JSON.parse(rawText);
      const currentPdfSettings = usePdfSettingsStore.getState().pdfSettings;

      const candidate = parsedJson.resumeData
        ? {
            ...parsedJson.resumeData,
            pdfSettings:
              parsedJson.pdfSettings ||
              parsedJson.resumeData?.pdfSettings ||
              currentPdfSettings,
            hiddenItemIds:
              parsedJson.hiddenItemIds ||
              parsedJson.resumeData?.hiddenItemIds ||
              [],
          }
        : {
            ...parsedJson,
            pdfSettings: parsedJson.pdfSettings || currentPdfSettings,
            hiddenItemIds: parsedJson.hiddenItemIds || [],
          };

      const validation = cvMasterJsonSchema.safeParse(candidate);
      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        throw new Error(
          firstIssue
            ? `Schema error at "${firstIssue.path.join('.')}": ${firstIssue.message}`
            : 'The selected JSON file does not match the CVMaster schema.'
        );
      }

      const validatedData = validation.data;
      setValidatedJsonPayload({
        resumeData: validatedData as unknown as ResumeData,
        pdfSettings: (validatedData.pdfSettings ||
          currentPdfSettings) as PdfSettings,
        hiddenItemIds: validatedData.hiddenItemIds || [],
        sectionOrder: Array.isArray(parsedJson.sectionOrder)
          ? (parsedJson.sectionOrder as SectionKey[])
          : undefined,
      });
      setIsJsonValidated(true);
      toast({
        title: t('import.jsonValidatedTitle'),
        description: t('import.jsonValidatedDesc'),
      });
    } catch (err) {
      setIsJsonValidated(false);
      setValidatedJsonPayload(null);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Invalid CVMaster JSON file format.'
      );
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage('');
    setIsJsonValidated(false);
    setValidatedJsonPayload(null);
    setExtractedPdfText('');
    setPdfPreviewText('');

    const lowerName = file.name.toLowerCase();
    let effectiveFormat = format;

    // Auto-detect format if user selects/drops a JSON, PDF, or Image file
    if (lowerName.endsWith('.json') || file.type === 'application/json') {
      effectiveFormat = 'cv-master-json';
      if (format !== 'cv-master-json') setFormat('cv-master-json');
    } else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      effectiveFormat = 'pdf';
      if (format !== 'pdf') setFormat('pdf');
    } else if (
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      file.type.startsWith('image/')
    ) {
      effectiveFormat = 'image';
      if (format !== 'image') setFormat('image');
    }

    if (effectiveFormat === 'pdf') {
      const check = validatePdfImportFile(file);
      if (!check.valid) {
        setErrorMessage(check.error || 'Invalid PDF file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      try {
        setIsExtractingPdf(true);
        const { fullText, previewText } = await extractTextFromPdfFile(file);
        setExtractedPdfText(fullText);
        setPdfPreviewText(previewText);
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Failed to extract text from PDF.'
        );
      } finally {
        setIsExtractingPdf(false);
      }
      return;
    }

    if (effectiveFormat === 'image') {
      const check = validateImageImportFile(file);
      if (!check.valid) {
        setErrorMessage(check.error || 'Invalid image file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      return;
    }

    if (effectiveFormat === 'cv-master-json') {
      if (!lowerName.endsWith('.json') && file.type !== 'application/json') {
        setErrorMessage('Please select a valid .json file.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      await validateJsonFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processSelectedFile(file);
  };

  // Step 1 for `cv-master-json`: Validate (`df`)
  const handleValidateJson = async () => {
    if (!selectedFile) return;
    await validateJsonFile(selectedFile);
  };

  // Final Import Action (`uf` / `Fu` / `zu`)
  const handleImport = async () => {
    if (!selectedFile) return;
    setErrorMessage('');

    try {
      setIsImporting(true);

      if (format === 'cv-master-json') {
        if (!isJsonValidated || !validatedJsonPayload) {
          setErrorMessage('Please validate the JSON file before importing.');
          return;
        }
        setResumeData(validatedJsonPayload.resumeData);
        updatePdfSettings(validatedJsonPayload.pdfSettings);
        setHiddenItemIds(validatedJsonPayload.hiddenItemIds);
        if (validatedJsonPayload.sectionOrder) {
          updateSectionOrder(validatedJsonPayload.sectionOrder);
        }
        toast({
          title: t('import.jsonImportedTitle'),
          description: t('import.jsonImportedDesc'),
        });
        resetState();
        onOpenChange(false);
        return;
      }

      if (format === 'pdf') {
        const textToParse =
          extractedPdfText ||
          (await extractTextFromPdfFile(selectedFile)).fullText;
        const { resumeData, pdfSettings } =
          await parsePdfResumeText(textToParse);
        setResumeData(resumeData);
        updatePdfSettings(pdfSettings);
        toast({
          title: t('import.pdfImportedTitle'),
          description: t('import.pdfImportedDesc'),
        });
        resetState();
        onOpenChange(false);
        return;
      }

      if (format === 'image') {
        const { resumeData, pdfSettings } =
          await parseImageResumeFile(selectedFile);
        setResumeData(resumeData);
        updatePdfSettings(pdfSettings);
        toast({
          title: t('import.imageImportedTitle'),
          description: t('import.imageImportedDesc'),
        });
        resetState();
        onOpenChange(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Could not import the selected file.';
      setErrorMessage(msg);
      toast({
        variant: 'destructive',
        title: t('import.importFailedTitle'),
        description: msg,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const canImport =
    Boolean(selectedFile) &&
    !isImporting &&
    !isExtractingPdf &&
    (format === 'pdf'
      ? extractedPdfText.length >= 50
      : format === 'image'
      ? !errorMessage
      : format === 'cv-master-json'
      ? isJsonValidated
      : false);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetState();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
          <DialogDescription>
            {t('import.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Format Selector (`Select`) */}
          <div className="space-y-1.5">
            <Label htmlFor="import-format-select">{t('import.fileFormat')}</Label>
            <Select
              value={format}
              onValueChange={(val) => resetState(val as ImportFormatType)}
            >
              <SelectTrigger id="import-format-select">
                <SelectValue placeholder={t('import.selectFormat')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  {t('import.formatPdf')}
                </SelectItem>
                <SelectItem value="image">
                  {t('import.formatImage')}
                </SelectItem>
                <SelectItem value="cv-master-json">
                  {t('import.formatCvMasterJson')}
                </SelectItem>
                <SelectItem value="json" disabled>
                  {t('import.formatGenericJson')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Drop / Picker Box */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={getAcceptAttribute(format)}
              className="hidden"
              data-testid="import-file-input"
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
                const droppedFile = e.dataTransfer?.files?.[0];
                if (droppedFile) {
                  void processSelectedFile(droppedFile);
                }
              }}
              disabled={isImporting || isExtractingPdf}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/50"
            >
              {format === 'pdf' ? (
                <FileText className="h-8 w-8 text-primary" />
              ) : format === 'image' ? (
                <ImageIcon className="h-8 w-8 text-primary" />
              ) : (
                <FileJson className="h-8 w-8 text-primary" />
              )}

              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : t('import.clickToChoose')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format === 'pdf' && t('import.supportedPdf')}
                  {format === 'image' && t('import.supportedImage')}
                  {format === 'cv-master-json' && t('import.supportedJson')}
                </p>
              </div>
            </button>
          </div>

          {/* PDF Extracted Text Preview Box (first 1,000 chars) */}
          {format === 'pdf' && isExtractingPdf && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{t('import.extractingPdf')}</span>
            </div>
          )}

          {format === 'pdf' && pdfPreviewText && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                {t('import.extractedPreview')}
              </Label>
              <div
                data-testid="pdf-extracted-preview"
                className="max-h-36 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs text-muted-foreground whitespace-pre-wrap"
              >
                {pdfPreviewText}
              </div>
            </div>
          )}

          {/* Two-step JSON Validation Banner */}
          {format === 'cv-master-json' && isJsonValidated && (
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{t('import.jsonValidatedBanner')}</span>
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
            disabled={isImporting}
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
          >
            {t('common.cancel')}
          </Button>

          {format === 'cv-master-json' && !isJsonValidated ? (
            <Button
              type="button"
              disabled={!selectedFile || isImporting}
              onClick={handleValidateJson}
            >
              {t('common.validate')}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!canImport}
              onClick={handleImport}
              className="gap-1.5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t('common.importing')}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>{t('common.import')}</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

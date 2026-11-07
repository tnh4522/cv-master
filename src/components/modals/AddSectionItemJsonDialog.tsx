import React, { useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Code2,
  Copy,
  FileCode,
  FileUp,
  Sparkles,
} from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { useResumeStore } from '@/store/useResumeStore';
import {
  getSectionJsonSample,
  parseSectionItemsFromJson,
} from '@/services/sectionJsonService';
import type { ListSectionKey, SectionItemUnion } from '@/types/resume';

export interface AddSectionItemJsonDialogProps {
  sectionKey: ListSectionKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSectionItemJsonDialog({
  sectionKey,
  open,
  onOpenChange,
}: AddSectionItemJsonDialogProps) {
  const { t } = useLanguage();
  const { resumeData, addSectionItems } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();

  const sectionDisplayName =
    resumeData.sectionTitles[sectionKey] || sectionKey;

  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [jsonText, setJsonText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<SectionItemUnion[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (open) {
      setJsonText('');
      setFileName(null);
      setParsedItems([]);
      setErrorMessage(null);
      setActiveTab('paste');
    }
  }, [open, sectionKey]);

  // Re-parse whenever jsonText changes
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setParsedItems([]);
      setErrorMessage(null);
      return;
    }

    const res = parseSectionItemsFromJson(sectionKey, text);
    if (res.error === 'INVALID_SYNTAX') {
      setParsedItems([]);
      setErrorMessage(
        t('jsonSectionItem.syntaxError') ||
          'Invalid JSON syntax. Please check formatting and brackets.'
      );
    } else if (res.error === 'SCHEMA_ERROR' || res.items.length === 0) {
      setParsedItems([]);
      setErrorMessage(
        t('jsonSectionItem.schemaError') ||
          'JSON does not contain any recognizable items for this section.'
      );
    } else {
      setErrorMessage(null);
      setParsedItems(res.items);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        handleJsonChange(content);
      }
    };
    reader.readAsText(file);
    // Reset file input value so user can re-upload same file if needed
    e.target.value = '';
  };

  const handleLoadSample = () => {
    const sample = getSectionJsonSample(sectionKey);
    handleJsonChange(sample);
  };

  const handleConfirmAdd = () => {
    if (parsedItems.length === 0) return;

    addSectionItems(sectionKey, parsedItems);

    toast({
      title:
        t('jsonSectionItem.successToastTitle') || 'Items Added Successfully',
      description: (
        t('jsonSectionItem.successToastDesc') ||
        'Added {count} items to {section}.'
      )
        .replace('{count}', String(parsedItems.length))
        .replace('{section}', sectionDisplayName),
    });

    onOpenChange(false);
  };

  const renderItemPreview = (item: SectionItemUnion, index: number) => {
    const title =
      ('name' in item && item.name) ||
      ('position' in item && item.position) ||
      `Item #${index + 1}`;

    let subtext = '';
    if ('position' in item && item.position && 'name' in item && item.name) {
      subtext = item.position;
    } else if ('degree' in item && item.degree) {
      subtext =
        'studyField' in item && item.studyField
          ? `${item.degree} • ${item.studyField}`
          : item.degree;
    } else if ('level' in item && item.level) {
      subtext = item.level;
    } else if ('issuer' in item && item.issuer) {
      subtext = item.issuer;
    } else if ('description' in item && item.description) {
      subtext = item.description;
    } else if ('keywords' in item && Array.isArray(item.keywords)) {
      subtext = item.keywords.slice(0, 5).join(', ');
    }

    return (
      <div
        key={item.id || index}
        data-testid="parsed-json-item-preview"
        className="flex items-start justify-between gap-2 rounded-md border border-border/70 bg-card p-2.5 text-xs transition-colors hover:border-primary/50"
      >
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate">{title}</div>
          {subtext && (
            <div className="text-muted-foreground truncate text-[11px] mt-0.5">
              {subtext}
            </div>
          )}
          {'keywords' in item &&
            Array.isArray(item.keywords) &&
            item.keywords.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {item.keywords.slice(0, 6).map((kw, i) => (
                  <span
                    key={i}
                    className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground"
                  >
                    {kw}
                  </span>
                ))}
                {item.keywords.length > 6 && (
                  <span className="text-[10px] text-muted-foreground self-center">
                    +{item.keywords.length - 6}
                  </span>
                )}
              </div>
            )}
        </div>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          #{index + 1}
        </span>
      </div>
    );
  };

  const titleTemplate =
    t('jsonSectionItem.dialogTitle') || 'Add {section} with JSON';
  const descTemplate =
    t('jsonSectionItem.dialogDesc') ||
    'Paste a JSON object (single item) or array of objects to quickly add items to this section.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {titleTemplate.replace('{section}', sectionDisplayName)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {descTemplate}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'paste' | 'file')}
            className="w-full"
          >
            <div className="flex items-center justify-between pb-2">
              <div className="flex rounded-lg border border-border p-1 bg-muted/30">
                <button
                  type="button"
                  data-testid="tab-paste-json"
                  onClick={() => setActiveTab('paste')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'paste'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('jsonSectionItem.pasteTab') || 'Paste JSON'}
                </button>
                <button
                  type="button"
                  data-testid="tab-upload-json"
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'file'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('jsonSectionItem.fileTab') || 'Upload JSON'}
                </button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs text-primary hover:text-primary/90"
                onClick={handleLoadSample}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t('jsonSectionItem.loadSample') || 'Load Sample'}</span>
              </Button>
            </div>

            {activeTab === 'paste' ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  data-testid="section-json-textarea"
                  rows={9}
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder={
                    t('jsonSectionItem.textareaPlaceholder') ||
                    'Paste your JSON array or object here...'
                  }
                  className="font-mono text-xs leading-relaxed resize-none bg-muted/30 focus-visible:ring-1"
                />
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  id={fileInputId}
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  data-testid="section-json-file-input"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor={fileInputId}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary/50 cursor-pointer bg-muted/20 transition-colors"
                >
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {fileName ? (
                        <span className="text-primary font-semibold">{fileName}</span>
                      ) : (
                        t('jsonSectionItem.fileUploadPlaceholder') ||
                        'Click to upload or drag & drop a .json file'
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Supports JSON array or object files
                    </p>
                  </div>
                </label>
              </div>
            )}
          </Tabs>

          {/* Validation Feedback & Error display */}
          {errorMessage && (
            <div
              data-testid="section-json-error-banner"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Parsed Items Preview List */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {(
                    t('jsonSectionItem.parsedPreview') ||
                    'Preview Parsed Items ({count})'
                  ).replace('{count}', String(parsedItems.length))}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Ready to add
                </span>
              </div>

              <ScrollArea className="max-h-56 rounded-md border border-border p-2 bg-muted/20">
                <div className="space-y-2">
                  {parsedItems.map((item, idx) => renderItemPreview(item, idx))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 px-6 border-t border-border/50 flex sm:justify-between items-center gap-2 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>

          <Button
            type="button"
            size="sm"
            data-testid="confirm-add-section-json-btn"
            disabled={parsedItems.length === 0}
            onClick={handleConfirmAdd}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {parsedItems.length <= 1
                ? t('jsonSectionItem.addSingleButton') || 'Add 1 Item'
                : (
                    t('jsonSectionItem.addButton') || 'Add {count} Items'
                  ).replace('{count}', String(parsedItems.length))}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

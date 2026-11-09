import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  FileDown,
  Layers,
  Sparkles,
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
  ScrollArea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { useResumeStore } from '@/store/useResumeStore';
import {
  type AnySectionKey,
  type SectionExportFormat,
  formatSectionExportFilename,
  formatSectionExportJson,
  triggerJsonDownload,
} from '@/services/sectionJsonService';
import type { SectionItemUnion } from '@/types/resume';

export interface ExportSectionJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionKey?: AnySectionKey;
}

const SECTION_OPTIONS: { key: AnySectionKey; labelKey?: string }[] = [
  { key: 'basics', labelKey: 'basics.title' },
  { key: 'summary' },
  { key: 'experience' },
  { key: 'projects' },
  { key: 'research' },
  { key: 'education' },
  { key: 'skills' },
  { key: 'softSkills' },
  { key: 'languages' },
  { key: 'certifications' },
  { key: 'awards' },
  { key: 'volunteering' },
  { key: 'interests' },
];

export function ExportSectionJsonDialog({
  open,
  onOpenChange,
  sectionKey = 'experience',
}: ExportSectionJsonDialogProps) {
  const { t } = useLanguage();
  const { resumeData, hiddenItemIds } = useResumeStore();

  const [activeSection, setActiveSection] = useState<AnySectionKey>(sectionKey);
  const [format, setFormat] = useState<SectionExportFormat>('array');
  const [excludeHidden, setExcludeHidden] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync activeSection when prop sectionKey changes on open
  useEffect(() => {
    if (open && sectionKey) {
      setActiveSection(sectionKey);
      setCopied(false);
    }
  }, [open, sectionKey]);

  const isListSection =
    activeSection !== 'basics' && activeSection !== 'summary';

  // Section Display Name
  const sectionDisplayName = useMemo(() => {
    if (activeSection === 'basics') {
      return t('basics.title') || 'Personal Information';
    }
    if (activeSection === 'summary') {
      return (
        resumeData.sectionTitles.summary ||
        resumeData.summary.sectionTitle ||
        'Summary'
      );
    }
    return resumeData.sectionTitles[activeSection] || activeSection;
  }, [activeSection, resumeData, t]);

  // Compute item count for list sections
  const itemCount = useMemo(() => {
    if (!isListSection) return 1;
    const items = (resumeData[activeSection] || []) as SectionItemUnion[];
    if (excludeHidden) {
      return items.filter((it) => !hiddenItemIds.includes(it.id)).length;
    }
    return items.length;
  }, [activeSection, isListSection, resumeData, excludeHidden, hiddenItemIds]);

  // Formatted JSON string
  const jsonContent = useMemo(() => {
    return formatSectionExportJson(activeSection, resumeData, {
      format,
      excludeHidden,
      hiddenItemIds,
    });
  }, [activeSection, resumeData, format, excludeHidden, hiddenItemIds]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonContent);
      } else {
        // Fallback for environments where writeText is restricted
        const el = document.createElement('textarea');
        el.value = jsonContent;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      toast({
        title:
          t('exportSectionJson.copiedToastTitle') || 'Copied to clipboard',
        description: (
          t('exportSectionJson.copiedToastDesc') ||
          'JSON data for {section} copied to clipboard.'
        ).replace('{section}', sectionDisplayName),
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Unable to copy to clipboard.',
      });
    }
  };

  const handleDownload = () => {
    const filename = formatSectionExportFilename(
      resumeData.basics,
      activeSection
    );
    triggerJsonDownload(filename, jsonContent);

    toast({
      title: t('download.jsonExportedTitle') || 'JSON exported',
      description: filename,
    });
  };

  const titleTemplate =
    t('exportSectionJson.dialogTitle') || 'Export {section} as JSON';
  const descTemplate =
    t('exportSectionJson.dialogDesc') ||
    'View, copy, or download structured JSON for this section.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileDown className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate">
                {titleTemplate.replace('{section}', sectionDisplayName)}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {descTemplate}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Controls Bar: Section Selector & Format Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/20 p-3">
            {/* Section Switcher */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('exportSectionJson.selectSection') || 'Select Section'}
              </Label>
              <Select
                value={activeSection}
                onValueChange={(val) => setActiveSection(val as AnySectionKey)}
              >
                <SelectTrigger
                  data-testid="export-section-select-trigger"
                  className="h-8 text-xs bg-background"
                >
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {SECTION_OPTIONS.map(({ key, labelKey }) => {
                    const name =
                      key === 'basics'
                        ? t('basics.title') || 'Personal Information'
                        : key === 'summary'
                        ? resumeData.sectionTitles.summary || 'Summary'
                        : resumeData.sectionTitles[key] || key;
                    return (
                      <SelectItem key={key} value={key} className="text-xs">
                        <div className="flex items-center gap-2">
                          <SectionIcon section={key} className="h-3.5 w-3.5" />
                          <span>{name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Format Structure Switcher */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('exportSectionJson.formatLabel') || 'JSON Structure'}
              </Label>
              <div className="flex rounded-md border border-border bg-background p-0.5 h-8">
                <button
                  type="button"
                  data-testid="export-format-array-btn"
                  onClick={() => setFormat('array')}
                  className={`flex-1 px-2 py-0.5 text-xs font-medium rounded transition-all truncate ${
                    format === 'array'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {isListSection ? 'Array [ ... ]' : 'Direct'}
                </button>
                <button
                  type="button"
                  data-testid="export-format-wrapped-btn"
                  onClick={() => setFormat('wrapped')}
                  className={`flex-1 px-2 py-0.5 text-xs font-medium rounded transition-all truncate ${
                    format === 'wrapped'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {`Wrapped { "${activeSection}": ... }`}
                </button>
              </div>
            </div>
          </div>

          {/* List Section Option: Exclude Hidden Items */}
          {isListSection && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="exclude-hidden-check"
                  checked={excludeHidden}
                  onCheckedChange={(checked) =>
                    setExcludeHidden(Boolean(checked))
                  }
                  data-testid="exclude-hidden-checkbox"
                />
                <Label
                  htmlFor="exclude-hidden-check"
                  className="text-xs cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {t('exportSectionJson.excludeHidden') ||
                    'Exclude items hidden from CV'}
                </Label>
              </div>

              <span className="text-xs font-mono text-muted-foreground">
                {(t('exportSectionJson.itemCount') || '{count} item(s)').replace(
                  '{count}',
                  String(itemCount)
                )}
              </span>
            </div>
          )}

          {/* JSON Preview Content Area */}
          <div className="relative rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/40 rounded-t-lg">
              <span className="font-mono flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-primary" />
                {formatSectionExportFilename(resumeData.basics, activeSection)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-[11px]"
                data-testid="copy-json-inline-btn"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-500 font-medium">
                      {t('exportSectionJson.copied') || 'Copied!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>{t('exportSectionJson.copyJson') || 'Copy'}</span>
                  </>
                )}
              </Button>
            </div>

            <Textarea
              data-testid="section-json-preview-textarea"
              readOnly
              rows={12}
              value={jsonContent}
              className="font-mono text-xs leading-relaxed resize-none border-0 bg-transparent focus-visible:ring-0 rounded-b-lg p-3"
            />
          </div>
        </div>

        <DialogFooter className="p-4 px-6 border-t border-border/50 flex sm:justify-between items-center gap-2 bg-muted/10">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t('common.close')}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="copy-section-json-btn"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>
                {copied
                  ? t('exportSectionJson.copied') || 'Copied!'
                  : t('exportSectionJson.copyJson') || 'Copy JSON'}
              </span>
            </Button>

            <Button
              type="button"
              size="sm"
              data-testid="download-section-json-btn"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {t('exportSectionJson.downloadJson') || 'Download .json'}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

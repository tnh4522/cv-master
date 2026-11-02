import React, { useEffect, useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { Button, Input, Separator } from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useResumeStore } from '@/store/useResumeStore';
import { useDebounceValue } from '@/lib/utils';

export function SummaryEditor() {
  const { resumeData, updateSummary, updateSectionTitle } = useResumeStore();
  const currentContent = resumeData.summary.content;
  const currentTitle =
    resumeData.sectionTitles.summary ||
    resumeData.summary.sectionTitle ||
    'Summary';

  const [localSummary, setLocalSummary] = useState(currentContent);
  const debouncedSummary = useDebounceValue(localSummary, 200);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(currentTitle);

  useEffect(() => {
    setLocalSummary(currentContent);
  }, [currentContent]);

  useEffect(() => {
    if (debouncedSummary !== currentContent) {
      updateSummary(debouncedSummary);
    }
  }, [debouncedSummary, currentContent, updateSummary]);

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
                tooltipContent="Rename section"
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
      </div>

      <RichTextEditor
        content={localSummary}
        onUpdate={(html) => setLocalSummary(html)}
      />

      <Separator className="my-4" />
    </section>
  );
}

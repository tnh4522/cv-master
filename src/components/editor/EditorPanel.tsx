import React from 'react';
import { ScrollArea } from '@/components/ui/primitives';
import { BasicsEditor } from '@/components/editor/BasicsEditor';
import { SummaryEditor } from '@/components/editor/SummaryEditor';
import { SectionListEditor } from '@/components/editor/SectionListEditor';
import { useResumeStore } from '@/store/useResumeStore';

export function EditorPanel() {
  const { sectionOrder } = useResumeStore();

  return (
    <ScrollArea className="h-full flex-1 bg-background">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 pb-20">
        <BasicsEditor />
        {sectionOrder.map((sectionKey) =>
          sectionKey === 'summary' ? (
            <SummaryEditor key="summary" />
          ) : (
            <SectionListEditor key={sectionKey} sectionKey={sectionKey} />
          )
        )}
      </div>
    </ScrollArea>
  );
}

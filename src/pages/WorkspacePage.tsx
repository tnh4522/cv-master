import React, { useState } from 'react';
import { FileEdit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Header } from '@/components/layout/Header';
import { SectionNavRail } from '@/components/editor/SectionNavRail';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { PreviewCanvas } from '@/components/preview/PreviewCanvas';
import { SectionDialogsHost } from '@/components/modals/SectionDialogs';
import { ThemeSwitch } from '@/context/ThemeContext';
import { useWindowSize } from '@/lib/utils';

export function WorkspacePage() {
  const { width } = useWindowSize();
  const isMobileOrTablet = (width ?? 1280) < 1024;
  const [mobileTab, setMobileTab] = useState<'content' | 'preview'>('content');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />

      {isMobileOrTablet ? (
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {mobileTab === 'content' ? <EditorPanel /> : <PreviewCanvas />}
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className="flex h-14 shrink-0 items-center justify-between border-t border-border bg-background/95 px-4 backdrop-blur">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={mobileTab === 'content' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => setMobileTab('content')}
              >
                <FileEdit className="h-3.5 w-3.5" />
                <span>Content</span>
              </Button>
              <Button
                type="button"
                variant={mobileTab === 'preview' ? 'default' : 'ghost'}
                size="sm"
                className="h-9 gap-1.5 text-xs"
                onClick={() => setMobileTab('preview')}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </Button>
            </div>

            <ThemeSwitch orientation="horizontal" />
          </div>
        </main>
      ) : (
        <main className="flex flex-1 overflow-hidden">
          <SectionNavRail />
          <div className="flex w-[48%] min-w-[420px] max-w-[680px] flex-col border-r border-border">
            <EditorPanel />
          </div>
          <div className="flex flex-1 overflow-hidden">
            <PreviewCanvas />
          </div>
        </main>
      )}

      <SectionDialogsHost />
    </div>
  );
}

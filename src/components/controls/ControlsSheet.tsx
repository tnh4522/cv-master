import React, { Suspense, lazy } from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Slider,
  Switch,
} from '@/components/ui/primitives';
import { FontPicker } from '@/components/controls/FontPicker';
import { usePdfSettingsStore, useResumeStore } from '@/store/useResumeStore';
import type { SkillsLayoutType } from '@/types/resume';

const DndSections = lazy(() => import('@/components/controls/DndSections'));

export interface ControlsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ControlsSheet({ open, onOpenChange }: ControlsSheetProps) {
  const { resumeData, updateBasics, resetSectionOrder } = useResumeStore();
  const { pdfSettings, updatePdfSettings, resetPdfSettings } =
    usePdfSettingsStore();

  const { alignment } = resumeData.basics;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle>CV Controls & Styling</SheetTitle>
              <SheetDescription>
                Customize layout, section order, typography, and margins.
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                resetPdfSettings();
                resetSectionOrder();
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <Accordion
            type="multiple"
            defaultValue={['layout', 'sections', 'typography', 'page']}
            className="w-full"
          >
            {/* 1. Layout & Alignment */}
            <AccordionItem value="layout">
              <AccordionTrigger className="text-sm font-semibold">
                Layout & Alignment
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Personal Info Alignment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={alignment === 'start' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'start' })}
                    >
                      <AlignLeft className="h-3.5 w-3.5" />
                      <span>Left</span>
                    </Button>
                    <Button
                      type="button"
                      variant={alignment === 'center' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'center' })}
                    >
                      <AlignCenter className="h-3.5 w-3.5" />
                      <span>Center</span>
                    </Button>
                    <Button
                      type="button"
                      variant={alignment === 'end' ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => updateBasics({ alignment: 'end' })}
                    >
                      <AlignRight className="h-3.5 w-3.5" />
                      <span>Right</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Skills Display Layout</Label>
                  <RadioGroup
                    value={pdfSettings.skillsLayout}
                    onValueChange={(val) =>
                      updatePdfSettings({
                        skillsLayout: val as SkillsLayoutType,
                      })
                    }
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="inline" id="skills-inline" />
                      <Label
                        htmlFor="skills-inline"
                        className="cursor-pointer text-xs font-normal"
                      >
                        Inline
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="grid-col" id="skills-grid-col" />
                      <Label
                        htmlFor="skills-grid-col"
                        className="cursor-pointer text-xs font-normal"
                      >
                        Grid Col
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 rounded-md border border-border p-2.5">
                      <RadioGroupItem value="grid-row" id="skills-grid-row" />
                      <Label
                        htmlFor="skills-grid-row"
                        className="cursor-pointer text-xs font-normal"
                      >
                        Grid Row
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Section Order (Drag and Drop) */}
            <AccordionItem value="sections">
              <AccordionTrigger className="text-sm font-semibold">
                Reorder Sections
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <Suspense
                  fallback={
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-9 w-full" />
                      ))}
                    </div>
                  }
                >
                  <DndSections />
                </Suspense>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Typography */}
            <AccordionItem value="typography">
              <AccordionTrigger className="text-sm font-semibold">
                Typography
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <FontPicker />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">Font Size</Label>
                    <span className="text-muted-foreground">
                      {pdfSettings.fontSize}px
                    </span>
                  </div>
                  <Slider
                    min={12}
                    max={18}
                    step={1}
                    value={[pdfSettings.fontSize]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ fontSize: val })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">Line Height</Label>
                    <span className="text-muted-foreground">
                      {(pdfSettings.lineHeight * 0.25).toFixed(2)}rem
                    </span>
                  </div>
                  <Slider
                    min={4}
                    max={10}
                    step={1}
                    value={[pdfSettings.lineHeight]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ lineHeight: val })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">Section Vertical Spacing</Label>
                    <span className="text-muted-foreground">
                      {pdfSettings.verticalSpacing}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[pdfSettings.verticalSpacing]}
                    onValueChange={([val]) =>
                      updatePdfSettings({ verticalSpacing: val })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Page & Margins */}
            <AccordionItem value="page">
              <AccordionTrigger className="text-sm font-semibold">
                Page Setup & Margins
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Label className="text-xs">Page Margin</Label>
                    <span className="text-muted-foreground">
                      {pdfSettings.margin.VALUE}px
                    </span>
                  </div>
                  <Slider
                    min={pdfSettings.margin.MIN}
                    max={pdfSettings.margin.MAX}
                    step={pdfSettings.margin.STEP || 1}
                    value={[pdfSettings.margin.VALUE]}
                    onValueChange={([val]) =>
                      updatePdfSettings({
                        margin: {
                          ...pdfSettings.margin,
                          VALUE: val,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-md border border-border p-3">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="page-break-switch"
                      className="cursor-pointer text-xs font-medium"
                    >
                      Show Page Break Lines
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Display dashed A4 page boundary lines in preview
                    </p>
                  </div>
                  <Switch
                    id="page-break-switch"
                    checked={pdfSettings.pageBreakLine}
                    onCheckedChange={(checked) =>
                      updatePdfSettings({ pageBreakLine: checked })
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

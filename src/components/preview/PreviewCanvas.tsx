import React, { useState } from 'react';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Mouse,
  SplitSquareVertical,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Separator } from '@/components/ui/primitives';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import { ControlsSheet } from '@/components/controls/ControlsSheet';
import { usePdfSettingsStore } from '@/store/useResumeStore';
import { useWindowSize } from '@/lib/utils';

interface CanvasFloatingToolbarProps {
  wheelMode: 'pan' | 'zoom';
  onToggleWheelMode: () => void;
  onOpenControls: () => void;
}

function CanvasFloatingToolbar({
  wheelMode,
  onToggleWheelMode,
  onOpenControls,
}: CanvasFloatingToolbarProps) {
  const { zoomIn, zoomOut, resetTransform, centerView } = useControls();
  const { pdfSettings, updatePdfSettings } = usePdfSettingsStore();

  return (
    <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-background/95 px-2.5 py-1.5 shadow-lg backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent="Zoom In"
        onClick={() => zoomIn(0.15)}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent="Zoom Out"
        onClick={() => zoomOut(0.15)}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent="Reset Zoom"
        onClick={() => resetTransform()}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent="Center View"
        onClick={() => centerView()}
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-4" />

      <Button
        type="button"
        variant={wheelMode === 'pan' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent={
          wheelMode === 'pan'
            ? 'Scroll to pan (click for zoom)'
            : 'Scroll to zoom (click for pan)'
        }
        onClick={onToggleWheelMode}
      >
        <Mouse className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        variant={pdfSettings.pageBreakLine ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-full"
        tooltipContent={
          pdfSettings.pageBreakLine
            ? 'Hide Page Break Line'
            : 'Show Page Break Line'
        }
        onClick={() =>
          updatePdfSettings({ pageBreakLine: !pdfSettings.pageBreakLine })
        }
      >
        <SplitSquareVertical className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-4" />

      <Button
        type="button"
        variant="default"
        size="sm"
        className="h-8 gap-1.5 rounded-full px-3 text-xs"
        onClick={onOpenControls}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        <span>Controls</span>
      </Button>
    </div>
  );
}

export interface PreviewCanvasProps {
  sheetRef?: React.RefObject<HTMLDivElement>;
}

export function PreviewCanvas({ sheetRef }: PreviewCanvasProps) {
  const { width } = useWindowSize();
  const safeWidth = width ?? 1280;
  const [wheelMode, setWheelMode] = useState<'pan' | 'zoom'>('pan');
  const [controlsOpen, setControlsOpen] = useState(false);

  const initialScale =
    safeWidth < 640 ? 0.42 : safeWidth < 1024 ? 0.58 : safeWidth < 1440 ? 0.68 : 0.78;

  return (
    <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden bg-muted/40">
      <TransformWrapper
        initialScale={initialScale}
        minScale={0.3}
        maxScale={2}
        centerOnInit
        limitToBounds={false}
        wheel={{
          wheelDisabled: wheelMode === 'pan',
          step: 0.08,
        }}
        panning={{
          wheelPanning: wheelMode === 'pan',
          velocityDisabled: false,
        }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
          }}
          contentStyle={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '48px 32px 110px 32px',
          }}
        >
          <ResumeSheet ref={sheetRef} mode="preview" />
        </TransformComponent>

        <CanvasFloatingToolbar
          wheelMode={wheelMode}
          onToggleWheelMode={() =>
            setWheelMode((prev) => (prev === 'pan' ? 'zoom' : 'pan'))
          }
          onOpenControls={() => setControlsOpen(true)}
        />
      </TransformWrapper>

      <ControlsSheet open={controlsOpen} onOpenChange={setControlsOpen} />
    </div>
  );
}

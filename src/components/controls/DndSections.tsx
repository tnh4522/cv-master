import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { useResumeStore } from '@/store/useResumeStore';
import { useLanguage } from '@/context/LanguageContext';
import type { SectionKey } from '@/types/resume';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

interface SortableSectionRowProps {
  sectionKey: SectionKey;
  title: string;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableSectionRow({
  sectionKey,
  title,
  index,
  total,
  onMoveUp,
  onMoveDown,
}: SortableSectionRowProps) {
  const { hiddenSections, toggleHideSection } = useResumeStore();
  const { t } = useLanguage();
  const isHidden = hiddenSections.includes(sectionKey);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionKey });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-2 text-sm shadow-sm transition-colors ${
        isDragging ? 'z-20 border-primary bg-accent/60' : 'hover:bg-accent/30'
      } ${isHidden ? 'opacity-60 bg-muted/30' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <SectionIcon
          section={sectionKey}
          className={`h-4 w-4 shrink-0 ${
            isHidden ? 'text-muted-foreground/60' : 'text-muted-foreground'
          }`}
        />
        <span
          className={`font-medium capitalize truncate ${
            isHidden ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {title}
        </span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Quick Move Up/Down buttons */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 disabled:pointer-events-none transition-colors"
          title={t('common.moveUp') || 'Di chuyển lên'}
          aria-label={`${t('common.moveUp') || 'Move up'} ${title}`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-25 disabled:pointer-events-none transition-colors"
          title={t('common.moveDown') || 'Di chuyển xuống'}
          aria-label={`${t('common.moveDown') || 'Move down'} ${title}`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {/* Toggle visibility */}
        <button
          type="button"
          onClick={() => toggleHideSection(sectionKey)}
          className={`rounded p-1 transition-colors ${
            isHidden
              ? 'text-amber-600 hover:bg-amber-500/20 dark:text-amber-400'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title={
            isHidden
              ? t('common.showSectionTooltip')
              : t('common.hideSectionTooltip')
          }
          aria-label={
            isHidden ? t('common.showSection') : t('common.hideSection')
          }
        >
          {isHidden ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>

        {/* Drag handle */}
        <button
          type="button"
          style={{ touchAction: 'none' }}
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing transition-colors"
          aria-label={`Drag to reorder ${title}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function DndSections() {
  const { sectionOrder, resumeData, updateSectionOrder, resetSectionOrder } =
    useResumeStore();
  const { sectionTitles } = resumeData;
  const { t } = useLanguage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(active.id as SectionKey);
      const newIndex = sectionOrder.indexOf(over.id as SectionKey);
      if (oldIndex !== -1 && newIndex !== -1) {
        updateSectionOrder(arrayMove(sectionOrder, oldIndex, newIndex));
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      updateSectionOrder(arrayMove(sectionOrder, index, index - 1));
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < sectionOrder.length - 1) {
      updateSectionOrder(arrayMove(sectionOrder, index, index + 1));
    }
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {sectionOrder.map((key, index) => (
              <SortableSectionRow
                key={key}
                sectionKey={key}
                title={sectionTitles[key] || key}
                index={index}
                total={sectionOrder.length}
                onMoveUp={() => handleMoveUp(index)}
                onMoveDown={() => handleMoveDown(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={resetSectionOrder}
        className="w-full text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t('controls.resetSectionOrder') || 'Khôi phục thứ tự mặc định'}
      </Button>
    </div>
  );
}

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
import { GripVertical } from 'lucide-react';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { useResumeStore } from '@/store/useResumeStore';
import type { SectionKey } from '@/types/resume';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

interface SortableSectionRowProps {
  sectionKey: SectionKey;
  title: string;
}

function SortableSectionRow({ sectionKey, title }: SortableSectionRowProps) {
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
      className={`flex items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm transition-colors ${
        isDragging ? 'z-20 border-primary bg-accent/60' : 'hover:bg-accent/30'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <SectionIcon
          section={sectionKey}
          className="h-4 w-4 text-muted-foreground"
        />
        <span className="font-medium capitalize">{title}</span>
      </div>
      <button
        type="button"
        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label={`Drag to reorder ${title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DndSections() {
  const { sectionOrder, resumeData, updateSectionOrder } = useResumeStore();
  const { sectionTitles } = resumeData;

  const sensors = useSensors(
    useSensor(PointerSensor),
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

  return (
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
          {sectionOrder.map((key) => (
            <SortableSectionRow
              key={key}
              sectionKey={key}
              title={sectionTitles[key] || key}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

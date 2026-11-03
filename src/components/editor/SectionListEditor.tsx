import React, { useState } from 'react';
import {
  Pencil,
  Check,
  Plus,
  MoreVertical,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
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
  Button,
  DeleteConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Separator,
} from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { useResumeStore } from '@/store/useResumeStore';
import { useDialog } from '@/context/DialogContext';
import { useLanguage } from '@/context/LanguageContext';
import type { ListSectionKey, SectionItemUnion } from '@/types/resume';

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

interface SectionListEditorProps {
  sectionKey: ListSectionKey;
}

function getItemSubtext(item: SectionItemUnion): string {
  if ('position' in item && item.position) return item.position;
  if ('degree' in item && item.degree) {
    return 'studyField' in item && item.studyField
      ? `${item.degree} • ${item.studyField}`
      : item.degree;
  }
  if ('certificate' in item || 'level' in item) {
    const parts: string[] = [];
    if ('level' in item && item.level) {
      parts.push(item.level);
    }
    if ('certificate' in item && item.certificate) {
      parts.push(
        item.score ? `${item.certificate} (${item.score})` : item.certificate
      );
    } else if ('score' in item && item.score) {
      parts.push(item.score);
    }
    if ('description' in item && item.description) {
      parts.push(item.description);
    }
    if (parts.length > 0) {
      return parts.join(' • ');
    }
  }
  if ('description' in item && item.description) {
    if (
      !('date' in item) &&
      'keywords' in item &&
      Array.isArray(item.keywords) &&
      item.keywords.length > 0
    ) {
      return `${item.description} • ${item.keywords.slice(0, 5).join(', ')}`;
    }
    return item.description;
  }
  if ('issuer' in item && item.issuer) return item.issuer;
  if (
    'keywords' in item &&
    Array.isArray(item.keywords) &&
    item.keywords.length > 0
  ) {
    return item.keywords.slice(0, 5).join(', ');
  }
  return '';
}

interface SortableItemCardProps {
  item: SectionItemUnion;
  index: number;
  total: number;
  sectionKey: ListSectionKey;
  isHidden: boolean;
  isExiting: boolean;
  subtitle: string;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableItemCard({
  item,
  index,
  total,
  isHidden,
  isExiting,
  subtitle,
  onEdit,
  onDuplicate,
  onToggleHide,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SortableItemCardProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onEdit}
      className={`group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/30 ${
        isDragging ? 'z-20 border-primary bg-accent/70 shadow-md' : ''
      } ${isHidden ? 'opacity-50' : ''} ${isExiting ? 'scale-95 opacity-0' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
        <button
          type="button"
          style={{ touchAction: 'none' }}
          className="cursor-grab p-1 text-muted-foreground/50 hover:text-foreground active:cursor-grabbing transition-colors rounded shrink-0 -ml-1"
          aria-label={`Drag to reorder ${item.name || subtitle || 'item'}`}
          onClick={(e) => e.stopPropagation()}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">
              {item.name || subtitle}
            </p>
            {isHidden && (
              <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                <EyeOff className="h-2.5 w-2.5" />
                {t('common.hidden')}
              </span>
            )}
          </div>
          {subtitle && item.name && (
            <p className="truncate text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
          disabled={index === 0}
          onClick={onMoveUp}
          tooltipContent={t('common.moveUp') || 'Di chuyển lên'}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:pointer-events-none"
          disabled={index === total - 1}
          onClick={onMoveDown}
          tooltipContent={t('common.moveDown') || 'Di chuyển xuống'}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label={`Actions for ${item.name || subtitle}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              <span>{t('common.edit')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveUp} disabled={index === 0}>
              <ChevronUp className="mr-2 h-3.5 w-3.5" />
              <span>{t('common.moveUp') || 'Di chuyển lên'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMoveDown} disabled={index === total - 1}>
              <ChevronDown className="mr-2 h-3.5 w-3.5" />
              <span>{t('common.moveDown') || 'Di chuyển xuống'}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              <span>{t('common.duplicate')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleHide}>
              {isHidden ? (
                <>
                  <Eye className="mr-2 h-3.5 w-3.5" />
                  <span>{t('common.showInPdf')}</span>
                </>
              ) : (
                <>
                  <EyeOff className="mr-2 h-3.5 w-3.5" />
                  <span>{t('common.hideFromPdf')}</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              <span>{t('common.delete')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function SectionListEditor({ sectionKey }: SectionListEditorProps) {
  const {
    resumeData,
    hiddenItemIds,
    hiddenSections,
    updateSectionTitle,
    deleteSectionItem,
    duplicateSectionItem,
    reorderSectionItems,
    moveSectionItem,
    toggleHideItem,
    toggleHideSection,
  } = useResumeStore();
  const { openDialog } = useDialog();
  const { t } = useLanguage();

  const items = (resumeData[sectionKey] || []) as SectionItemUnion[];
  const title = resumeData.sectionTitles[sectionKey] || sectionKey;
  const isSectionHidden = hiddenSections.includes(sectionKey);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderSectionItems(sectionKey, arrayMove(items, oldIndex, newIndex));
      }
    }
  };

  const handleSaveTitle = () => {
    const trimmed = titleDraft.trim() || sectionKey;
    updateSectionTitle(sectionKey, trimmed);
    setTitleDraft(trimmed);
    setIsEditingTitle(false);
  };

  const handleConfirmDelete = (id: string) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
    setTimeout(() => {
      deleteSectionItem(sectionKey, id);
      setDeletingId(null);
    }, 300);
  };

  return (
    <section id={`section-${sectionKey}`} className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SectionIcon section={sectionKey} className="h-5 w-5 text-primary" />
          {isEditingTitle ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                }}
                className="h-8 w-56 text-sm font-bold capitalize"
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
              <h2 className="text-lg font-bold capitalize tracking-tight">
                {title}
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-60 group-hover:opacity-100"
                tooltipContent={t('common.renameSection')}
                onClick={() => {
                  setTitleDraft(title);
                  setIsEditingTitle(true);
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 px-2.5 text-xs ${
              isSectionHidden
                ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            tooltipContent={
              isSectionHidden
                ? t('common.showSectionTooltip')
                : t('common.hideSectionTooltip')
            }
            onClick={() => toggleHideSection(sectionKey)}
          >
            {isSectionHidden ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>{t('common.sectionHidden')}</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('common.hideSection')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {isSectionHidden && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleHideSection(sectionKey)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleHideSection(sectionKey);
            }
          }}
          className="flex cursor-pointer items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
        >
          <div className="flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5 shrink-0" />
            <span>{t('common.sectionHiddenBanner')}</span>
          </div>
          <span className="ml-2 shrink-0 font-semibold underline underline-offset-2">
            {t('common.showSection')}
          </span>
        </div>
      )}

      {/* Section Items List with Drag-and-Drop and Reordering */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((it) => it.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => {
              const isHidden = hiddenItemIds.includes(item.id);
              const isExiting = deletingId === item.id;
              const subtitle = getItemSubtext(item);

              return (
                <SortableItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  sectionKey={sectionKey}
                  isHidden={isHidden}
                  isExiting={isExiting}
                  subtitle={subtitle}
                  onEdit={() => openDialog(sectionKey, 'edit', item)}
                  onDuplicate={() => duplicateSectionItem(sectionKey, item.id)}
                  onToggleHide={() => toggleHideItem(item.id)}
                  onDelete={() => setConfirmDeleteId(item.id)}
                  onMoveUp={() => moveSectionItem(sectionKey, index, index - 1)}
                  onMoveDown={() => moveSectionItem(sectionKey, index, index + 1)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-1.5 border-dashed text-xs"
        onClick={() => openDialog(sectionKey, 'create')}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t('common.addNewItem')}</span>
      </Button>

      <DeleteConfirmDialog
        open={Boolean(confirmDeleteId)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
        title={t('common.deleteItemTitle')}
        description={t('common.deleteItemDesc')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onConfirm={() => {
          if (confirmDeleteId) handleConfirmDelete(confirmDeleteId);
        }}
      />

      <Separator className="my-4" />
    </section>
  );
}

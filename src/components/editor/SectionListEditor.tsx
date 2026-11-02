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
} from 'lucide-react';
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
  if ('level' in item && item.level) {
    const parts = [item.level];
    if (item.certificate) {
      parts.push(
        item.score ? `${item.certificate} (${item.score})` : item.certificate
      );
    } else if (item.score) {
      parts.push(item.score);
    }
    if (item.description) {
      parts.push(item.description);
    }
    return parts.join(' • ');
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

export function SectionListEditor({ sectionKey }: SectionListEditorProps) {
  const {
    resumeData,
    hiddenItemIds,
    updateSectionTitle,
    deleteSectionItem,
    duplicateSectionItem,
    toggleHideItem,
  } = useResumeStore();
  const { openDialog } = useDialog();
  const { t } = useLanguage();

  const items = (resumeData[sectionKey] || []) as SectionItemUnion[];
  const title = resumeData.sectionTitles[sectionKey] || sectionKey;

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      </div>

      {/* Section Items List */}
      <div className="space-y-2">
        {items.map((item) => {
          const isHidden = hiddenItemIds.includes(item.id);
          const isExiting = deletingId === item.id;
          const subtitle = getItemSubtext(item);

          return (
            <div
              key={item.id}
              onClick={() => openDialog(sectionKey, 'edit', item)}
              className={`group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card/60 px-3.5 py-2.5 transition-all duration-300 hover:border-primary/40 hover:bg-accent/30 ${
                isHidden ? 'opacity-50' : ''
              } ${isExiting ? 'scale-95 opacity-0' : ''}`}
            >
              <div className="min-w-0 flex-1 pr-3">
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

              <div
                className="flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label={`Actions for ${item.name}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() => openDialog(sectionKey, 'edit', item)}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      <span>{t('common.edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => duplicateSectionItem(sectionKey, item.id)}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      <span>{t('common.duplicate')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleHideItem(item.id)}>
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
                      onClick={() => setConfirmDeleteId(item.id)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      <span>{t('common.delete')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

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

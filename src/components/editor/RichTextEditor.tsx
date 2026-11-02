import React, { useEffect, useState } from 'react';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import BoldExtension from '@tiptap/extension-bold';
import ItalicExtension from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import History from '@tiptap/extension-history';
import Link from '@tiptap/extension-link';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Undo,
  Redo,
  Sparkles,
  SpellCheck2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from '@/components/ui/primitives';
import { toast } from '@/components/ui/toast';
import {
  CUSTOMIZE_OPTIONS,
  type CustomizeOption,
  customizeWriting,
  fixTypos,
  improveWriting,
} from '@/services/aiService';

const extensions = [
  Document,
  Paragraph,
  Text,
  BoldExtension,
  ItalicExtension,
  ListItem,
  BulletList.configure({
    keepMarks: true,
    keepAttributes: false,
  }),
  OrderedList.configure({
    keepMarks: true,
    keepAttributes: false,
  }),
  History,
  Link.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: 'https',
  }),
];

function RegeneratingOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-center gap-2 bg-background/85 p-4 backdrop-blur-[1px]">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
        <span>Refining content with AI...</span>
      </div>
      <Skeleton className="h-3.5 w-full" />
      <Skeleton className="h-3.5 w-11/12" />
      <Skeleton className="h-3.5 w-3/4" />
    </div>
  );
}

interface EditorToolbarProps {
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  onUpdateContent: (html: string) => void;
}

function EditorToolbar({
  isGenerating,
  setIsGenerating,
  onUpdateContent,
}: EditorToolbarProps) {
  const { editor } = useCurrentEditor();
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [customizeKey, setCustomizeKey] = useState<string>('');

  if (!editor) return null;

  const isEmptyText = editor.getText().trim().length === 0;

  const handleSetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const normalized = /^https?:\/\//i.test(linkUrl.trim())
        ? linkUrl.trim()
        : `https://${linkUrl.trim()}`;
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: normalized })
        .run();
    }
    setLinkOpen(false);
    setLinkUrl('');
  };

  const handleImproveWriting = async () => {
    if (isEmptyText || isGenerating) return;
    try {
      setIsGenerating(true);
      const html = editor.getHTML();
      const result = await improveWriting(html);
      editor.commands.setContent(result);
      onUpdateContent(result);
      toast({
        title: 'Writing improved',
        description: 'Your content has been refined for stronger impact.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to improve writing',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFixTypos = async () => {
    if (isEmptyText || isGenerating) return;
    try {
      setIsGenerating(true);
      const html = editor.getHTML();
      const result = await fixTypos(html);
      editor.commands.setContent(result);
      onUpdateContent(result);
      toast({
        title: 'Spelling & grammar checked',
        description: 'Any detected typos and spacing issues were fixed.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Failed to check typos',
        description: 'Please try again in a moment.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomize = async (value: string) => {
    setCustomizeKey('');
    if (!value || isEmptyText || isGenerating) return;
    try {
      setIsGenerating(true);
      const html = editor.getHTML();
      const result = await customizeWriting(html, value as CustomizeOption);
      editor.commands.setContent(result);
      onUpdateContent(result);
      const optionLabel =
        CUSTOMIZE_OPTIONS.find((o) => o.value === value)?.label || 'Customized';
      toast({
        title: `${optionLabel} applied`,
        description: 'Your text has been updated.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Customization failed',
        description: 'Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col border-b border-border bg-muted/20">
      <div className="flex flex-wrap items-center gap-0.5 p-1.5">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          tooltipContent="Bold"
          disabled={isGenerating}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          tooltipContent="Italic"
          disabled={isGenerating}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          tooltipContent="Bullet List"
          disabled={isGenerating}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          tooltipContent="Ordered List"
          disabled={isGenerating}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-4" />

        <Popover
          open={linkOpen}
          onOpenChange={(open) => {
            setLinkOpen(open);
            if (open) {
              setLinkUrl(editor.getAttributes('link').href || '');
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              tooltipContent="Add Link"
              disabled={isGenerating}
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2" align="start">
            <form onSubmit={handleSetLink} className="flex items-center gap-1.5">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" className="h-8 px-2.5 text-xs">
                Save
              </Button>
            </form>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          tooltipContent="Remove Link"
          disabled={!editor.isActive('link') || isGenerating}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <Unlink className="h-3.5 w-3.5" />
        </Button>

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            tooltipContent="Undo"
            disabled={!editor.can().chain().focus().undo().run() || isGenerating}
            onClick={() => editor.chain().focus().undo().run()}
          >
            <Undo className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            tooltipContent="Redo"
            disabled={!editor.can().chain().focus().redo().run() || isGenerating}
            onClick={() => editor.chain().focus().redo().run()}
          >
            <Redo className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* AI Writing Assistant Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 bg-background/50 px-2 py-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs"
          disabled={isEmptyText || isGenerating}
          onClick={handleImproveWriting}
        >
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Improve Writing</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs"
          disabled={isEmptyText || isGenerating}
          onClick={handleFixTypos}
        >
          <SpellCheck2 className="h-3 w-3 text-primary" />
          <span>Fix Typos</span>
        </Button>

        <Select
          value={customizeKey}
          onValueChange={handleCustomize}
          disabled={isEmptyText || isGenerating}
        >
          <SelectTrigger className="h-7 w-[140px] gap-1 px-2.5 text-xs">
            <SlidersHorizontal className="h-3 w-3 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="Customize" />
          </SelectTrigger>
          <SelectContent>
            {CUSTOMIZE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function EditorContentSync({ content }: { content: string }) {
  const { editor } = useCurrentEditor();

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    if (content !== currentHtml) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  return null;
}

export interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  content,
  onUpdate,
  className = '',
}: RichTextEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring ${className}`}
    >
      <EditorProvider
        slotBefore={
          <EditorToolbar
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            onUpdateContent={onUpdate}
          />
        }
        extensions={extensions}
        content={content}
        immediatelyRender={false}
        onUpdate={({ editor }) => {
          onUpdate(editor.getHTML());
        }}
        editorProps={{
          attributes: {
            class:
              'tiptap prose prose-sm dark:prose-invert max-w-none min-h-[120px] px-3 py-2 text-sm focus:outline-none',
          },
        }}
      >
        <EditorContentSync content={content} />
      </EditorProvider>
      {isGenerating && <RegeneratingOverlay />}
    </div>
  );
}

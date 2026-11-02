import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/primitives';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { useDialog } from '@/context/DialogContext';
import { useResumeStore } from '@/store/useResumeStore';
import {
  awardItemSchema,
  certificationItemSchema,
  educationItemSchema,
  experienceItemSchema,
  interestItemSchema,
  languageItemSchema,
  projectItemSchema,
  skillItemSchema,
  volunteeringItemSchema,
} from '@/schemas/resumeSchemas';
import type {
  AwardItem,
  CertificationItem,
  EducationItem,
  ExperienceItem,
  InterestItem,
  LanguageItem,
  ProjectItem,
  SkillItem,
  VolunteeringItem,
} from '@/types/resume';

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Freelance',
  'Internship',
] as const;

const LANGUAGE_LEVELS = [
  'Basic',
  'Conversational',
  'Advanced',
  'Fluent',
  'Native or Bilingual',
] as const;

type ExperienceFormValues = z.infer<typeof experienceItemSchema>;
type ProjectFormValues = z.infer<typeof projectItemSchema>;
type EducationFormValues = z.infer<typeof educationItemSchema>;
type SkillFormValues = z.infer<typeof skillItemSchema>;
type LanguageFormValues = z.infer<typeof languageItemSchema>;
type CertificationFormValues = z.infer<typeof certificationItemSchema>;
type AwardFormValues = z.infer<typeof awardItemSchema>;
type VolunteeringFormValues = z.infer<typeof volunteeringItemSchema>;
type InterestFormValues = z.infer<typeof interestItemSchema>;

interface SortableKeywordChipProps {
  keyword: string;
  onRemove: (kw: string) => void;
}

export function SortableKeywordChip({
  keyword,
  onRemove,
}: SortableKeywordChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: keyword });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={`Reorder ${keyword}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <span>{keyword}</span>
      <button
        type="button"
        onClick={() => onRemove(keyword)}
        className="ml-0.5 rounded-sm text-muted-foreground hover:text-destructive"
        aria-label={`Remove ${keyword}`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

interface KeywordListInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  placeholder?: string;
}

function KeywordListInput({
  keywords,
  onChange,
  placeholder = 'Type a keyword and press Enter or comma',
}: KeywordListInputProps) {
  const [inputValue, setInputValue] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const addKeyword = (raw: string) => {
    const tokens = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;
    const next = [...keywords];
    for (const token of tokens) {
      if (!next.includes(token)) {
        next.push(token);
      }
    }
    onChange(next);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addKeyword(inputValue);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = keywords.indexOf(String(active.id));
      const newIndex = keywords.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onChange(arrayMove(keywords, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => addKeyword(inputValue)}
        >
          Add
        </Button>
      </div>

      {keywords.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={keywords}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords.map((kw) => (
                <SortableKeywordChip
                  key={kw}
                  keyword={kw}
                  onRemove={(target) =>
                    onChange(keywords.filter((item) => item !== target))
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/* ============================================================================
 * 1. ExperienceDialog
 * ========================================================================== */
function ExperienceDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'experience' && mode !== null;

  const form = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceItemSchema),
    defaultValues: {
      name: '',
      position: '',
      dateRange: '',
      location: '',
      employmentType: '',
      website: '',
      summary: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as ExperienceItem;
      form.reset({
        name: item.name || '',
        position: item.position || '',
        dateRange: item.dateRange || '',
        location: item.location || '',
        employmentType: item.employmentType || '',
        website: item.website || '',
        summary: item.summary || '',
      });
    } else {
      form.reset({
        name: '',
        position: '',
        dateRange: '',
        location: '',
        employmentType: 'Full-time',
        website: '',
        summary: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: ExperienceFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `exp-${Date.now()}`;
    const payload: ExperienceItem = { id, ...values };
    if (mode === 'edit') {
      updateSectionItem('experience', payload);
    } else {
      addSectionItem('experience', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Work Experience' : 'Add Work Experience'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date or Date Range</FormLabel>
                    <FormControl>
                      <Input placeholder="Jan 2022 - Present" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Type</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 2. ProjectsDialog
 * ========================================================================== */
function ProjectsDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'projects' && mode !== null;

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectItemSchema),
    defaultValues: {
      name: '',
      description: '',
      date: '',
      website: '',
      summary: '',
      keywords: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as ProjectItem;
      form.reset({
        name: item.name || '',
        description: item.description || '',
        date: item.date || '',
        website: item.website || '',
        summary: item.summary || '',
        keywords: item.keywords || [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        date: '',
        website: '',
        summary: '',
        keywords: [],
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: ProjectFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `proj-${Date.now()}`;
    const payload: ProjectItem = {
      id,
      name: values.name,
      description: values.description,
      date: values.date,
      website: values.website,
      summary: values.summary,
      keywords: values.keywords || [],
    };
    if (mode === 'edit') {
      updateSectionItem('projects', payload);
    } else {
      addSectionItem('projects', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Project' : 'Add Project'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="CloudScale Analytics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Open-source telemetry engine"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date or Date Range</FormLabel>
                    <FormControl>
                      <Input placeholder="2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords / Technologies</FormLabel>
                  <FormControl>
                    <KeywordListInput
                      keywords={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 3. EducationDialog
 * ========================================================================== */
function EducationDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'education' && mode !== null;

  const form = useForm<EducationFormValues>({
    resolver: zodResolver(educationItemSchema),
    defaultValues: {
      name: '',
      degree: '',
      studyField: '',
      date: '',
      website: '',
      summary: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as EducationItem;
      form.reset({
        name: item.name || '',
        degree: item.degree || '',
        studyField: item.studyField || '',
        date: item.date || '',
        website: item.website || '',
        summary: item.summary || '',
      });
    } else {
      form.reset({
        name: '',
        degree: '',
        studyField: '',
        date: '',
        website: '',
        summary: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: EducationFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `edu-${Date.now()}`;
    const payload: EducationItem = { id, ...values };
    if (mode === 'edit') {
      updateSectionItem('education', payload);
    } else {
      addSectionItem('education', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Education' : 'Add Education'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="University of California, Berkeley"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Degree</FormLabel>
                    <FormControl>
                      <Input placeholder="B.S." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studyField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field of Study</FormLabel>
                    <FormControl>
                      <Input placeholder="Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date or Date Range</FormLabel>
                    <FormControl>
                      <Input placeholder="2015 - 2019" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://berkeley.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 4. SkillsDialog
 * ========================================================================== */
function SkillsDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'skills' && mode !== null;

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillItemSchema),
    defaultValues: {
      name: '',
      keywords: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as SkillItem;
      form.reset({
        name: item.name || '',
        keywords: item.keywords || [],
      });
    } else {
      form.reset({
        name: '',
        keywords: [],
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: SkillFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `skill-${Date.now()}`;
    const payload: SkillItem = {
      id,
      name: values.name,
      keywords: values.keywords,
    };
    if (mode === 'edit') {
      updateSectionItem('skills', payload);
    } else {
      addSectionItem('skills', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Skill Category' : 'Add Skill Category'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Frontend Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <KeywordListInput
                      keywords={field.value || []}
                      onChange={field.onChange}
                      placeholder="e.g. React, TypeScript (press Enter)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 5. LanguagesDialog
 * ========================================================================== */
function LanguagesDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'languages' && mode !== null;

  const form = useForm<LanguageFormValues>({
    resolver: zodResolver(languageItemSchema),
    defaultValues: {
      name: '',
      level: '',
      certificate: '',
      score: '',
      date: '',
      website: '',
      listening: '',
      speaking: '',
      reading: '',
      writing: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as LanguageItem;
      form.reset({
        name: item.name || '',
        level: item.level || '',
        certificate: item.certificate || '',
        score: item.score || '',
        date: item.date || '',
        website: item.website || '',
        listening: item.listening || '',
        speaking: item.speaking || '',
        reading: item.reading || '',
        writing: item.writing || '',
        description: item.description || '',
      });
    } else {
      form.reset({
        name: '',
        level: 'Fluent',
        certificate: '',
        score: '',
        date: '',
        website: '',
        listening: '',
        speaking: '',
        reading: '',
        writing: '',
        description: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: LanguageFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `lang-${Date.now()}`;
    const payload: LanguageItem = {
      id,
      name: values.name,
      level: values.level,
      certificate: values.certificate || '',
      score: values.score || '',
      date: values.date || '',
      website: values.website || '',
      listening: values.listening || '',
      speaking: values.speaking || '',
      reading: values.reading || '',
      writing: values.writing || '',
      description: values.description || '',
    };
    if (mode === 'edit') {
      updateSectionItem('languages', payload);
    } else {
      addSectionItem('languages', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Language' : 'Add Language'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Input placeholder="English, Japanese..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency Level</FormLabel>
                    <Select
                      value={field.value || ''}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select proficiency level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGE_LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={lvl}>
                            {lvl}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="certificate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="IELTS Academic, TOEIC, JLPT..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score / Grade (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="8.0 / 9.0, 950, N2..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date / Validity (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="2024 or 2023 - 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://credentials.example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2 rounded-md border border-border/70 bg-muted/20 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                4 Skills Assessment (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <FormField
                  control={form.control}
                  name="listening"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Listening</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 8.5 / Fluent"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="speaking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Speaking</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 7.5 / Fluent"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Reading</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 8.5 / Advanced"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="writing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Writing</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 7.5 / Advanced"
                          className="h-8 text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Full professional proficiency in technical presentations and cross-team collaboration"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 6. CertificationsDialog
 * ========================================================================== */
function CertificationsDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'certifications' && mode !== null;

  const form = useForm<CertificationFormValues>({
    resolver: zodResolver(certificationItemSchema),
    defaultValues: {
      name: '',
      issuer: '',
      date: '',
      website: '',
      summary: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as CertificationItem;
      form.reset({
        name: item.name || '',
        issuer: item.issuer || '',
        date: item.date || '',
        website: item.website || '',
        summary: item.summary || '',
      });
    } else {
      form.reset({
        name: '',
        issuer: '',
        date: '',
        website: '',
        summary: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: CertificationFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `cert-${Date.now()}`;
    const payload: CertificationItem = {
      id,
      name: values.name || '',
      issuer: values.issuer || '',
      date: values.date,
      website: values.website,
      summary: values.summary,
    };
    if (mode === 'edit') {
      updateSectionItem('certifications', payload);
    } else {
      addSectionItem('certifications', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Certification' : 'Add Certification'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AWS Certified Solutions Architect"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuer</FormLabel>
                    <FormControl>
                      <Input placeholder="Amazon Web Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input placeholder="2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credential URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://aws.amazon.com/verification"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 7. AwardsDialog
 * ========================================================================== */
function AwardsDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'awards' && mode !== null;

  const form = useForm<AwardFormValues>({
    resolver: zodResolver(awardItemSchema),
    defaultValues: {
      name: '',
      issuer: '',
      date: '',
      website: '',
      summary: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as AwardItem;
      form.reset({
        name: item.name || '',
        issuer: item.issuer || '',
        date: item.date || '',
        website: item.website || '',
        summary: item.summary || '',
      });
    } else {
      form.reset({
        name: '',
        issuer: '',
        date: '',
        website: '',
        summary: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: AwardFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `award-${Date.now()}`;
    const payload: AwardItem = { id, ...values };
    if (mode === 'edit') {
      updateSectionItem('awards', payload);
    } else {
      addSectionItem('awards', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Award' : 'Add Award'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1st Place Global Hackathon"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issuer</FormLabel>
                    <FormControl>
                      <Input placeholder="TechCrunch Disrupt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input placeholder="2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 8. VolunteeringDialog
 * ========================================================================== */
function VolunteeringDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'volunteering' && mode !== null;

  const form = useForm<VolunteeringFormValues>({
    resolver: zodResolver(volunteeringItemSchema),
    defaultValues: {
      name: '',
      position: '',
      date: '',
      location: '',
      summary: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as VolunteeringItem;
      form.reset({
        name: item.name || '',
        position: item.position || '',
        date: item.date || '',
        location: item.location || '',
        summary: item.summary || '',
      });
    } else {
      form.reset({
        name: '',
        position: '',
        date: '',
        location: '',
        summary: '',
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: VolunteeringFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `vol-${Date.now()}`;
    const payload: VolunteeringItem = { id, ...values };
    if (mode === 'edit') {
      updateSectionItem('volunteering', payload);
    } else {
      addSectionItem('volunteering', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Volunteering' : 'Add Volunteering'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <FormControl>
                      <Input placeholder="Code for America" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position / Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Technical Mentor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date or Date Range</FormLabel>
                    <FormControl>
                      <Input placeholder="2020 - Present" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      content={field.value || ''}
                      onUpdate={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================================
 * 9. InterestsDialog
 * ========================================================================== */
function InterestsDialog() {
  const { activeSection, mode, activeItem, closeDialog } = useDialog();
  const { addSectionItem, updateSectionItem } = useResumeStore();
  const open = activeSection === 'interests' && mode !== null;

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestItemSchema),
    defaultValues: {
      name: '',
      description: '',
      keywords: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && activeItem) {
      const item = activeItem as InterestItem;
      form.reset({
        name: item.name || '',
        description: item.description || '',
        keywords: item.keywords || [],
      });
    } else {
      form.reset({
        name: '',
        description: '',
        keywords: [],
      });
    }
  }, [open, mode, activeItem, form]);

  const onSubmit = (values: InterestFormValues) => {
    const id =
      mode === 'edit' && activeItem ? activeItem.id : `int-${Date.now()}`;
    const payload: InterestItem = {
      id,
      name: values.name,
      description: values.description || '',
      keywords: values.keywords || [],
    };
    if (mode === 'edit') {
      updateSectionItem('interests', payload);
    } else {
      addSectionItem('interests', payload);
    }
    closeDialog();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && closeDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Interest' : 'Add Interest'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hobby / Interest</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Photography, Open Source, Running..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Landscape & street photography, 3x half-marathon finisher"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords / Tags (Optional)</FormLabel>
                  <FormControl>
                    <KeywordListInput
                      keywords={field.value || []}
                      onChange={field.onChange}
                      placeholder="e.g. 35mm Film, Lightroom (press Enter)"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {mode === 'edit' ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export function SectionDialogsHost() {
  return (
    <>
      <ExperienceDialog />
      <ProjectsDialog />
      <EducationDialog />
      <SkillsDialog />
      <LanguagesDialog />
      <CertificationsDialog />
      <AwardsDialog />
      <VolunteeringDialog />
      <InterestsDialog />
    </>
  );
}

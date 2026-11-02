import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, History } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Textarea,
} from '@/components/ui/primitives';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import { aiReviewInputSchema } from '@/schemas/resumeSchemas';
import { useResumeStore, useReviewStore } from '@/store/useResumeStore';
import { analyzeResumeForRole } from '@/services/aiService';

type AiReviewFormValues = z.infer<typeof aiReviewInputSchema>;

export interface AiReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiReviewDialog({ open, onOpenChange }: AiReviewDialogProps) {
  const navigate = useNavigate();
  const { resumeData } = useResumeStore();
  const { currentAnalysis, setAnalysis } = useReviewStore();
  const { language, t } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const form = useForm<AiReviewFormValues>({
    resolver: zodResolver(aiReviewInputSchema),
    defaultValues: {
      jobTitle: resumeData.basics.title || 'Software Engineer',
      jobDescription: '',
    },
  });

  const onSubmit = async (values: AiReviewFormValues) => {
    try {
      setIsAnalyzing(true);
      const analysis = await analyzeResumeForRole({
        resumeData,
        jobTitle: values.jobTitle,
        jobDescription: values.jobDescription,
        language: resumeData.cvLanguage || 'en',
      });
      setAnalysis(analysis);
      toast({
        title: t('aiReview.completeTitle'),
        description: t('aiReview.completeDesc', { score: analysis.overallScore }),
      });
      onOpenChange(false);
      navigate('/review');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('aiReview.failedTitle'),
        description:
          err instanceof Error
            ? err.message
            : 'Could not complete CV review. Please try again.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isAnalyzing) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{t('aiReview.dialogTitle')}</span>
          </DialogTitle>
          <DialogDescription>
            {t('aiReview.dialogDesc')}
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div
            data-testid="ai-review-loading-overlay"
            className="flex flex-col items-center justify-center gap-3 py-10 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-semibold">{t('aiReview.analyzingTitle')}</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {t('aiReview.analyzingDesc')}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentAnalysis && (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5">
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">
                      {t('aiReview.previousAvailable', {
                        score: currentAnalysis.overallScore,
                      })}
                    </p>
                    <p className="text-muted-foreground">
                      {t('aiReview.fitLevelLabel', {
                        level: currentAnalysis.summary.fitLevel,
                      })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/review');
                    }}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>{t('aiReview.viewLastReview')}</span>
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aiReview.targetJobTitle')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('aiReview.targetJobPlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('aiReview.jobDescription')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('aiReview.jobDescriptionPlaceholder')}
                        className="min-h-[130px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>{t('aiReview.submitBtn')}</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

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
      });
      setAnalysis(analysis);
      toast({
        title: 'CV Analysis Complete',
        description: `Overall readiness score: ${analysis.overallScore}/100`,
      });
      onOpenChange(false);
      navigate('/review');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
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
            <span>AI CV Review & ATS Scoring</span>
          </DialogTitle>
          <DialogDescription>
            Evaluate your CV against your target job title and job description (min 100 characters) using Gemini AI for personalized ATS feedback and an action plan.
          </DialogDescription>
        </DialogHeader>

        {isAnalyzing ? (
          <div
            data-testid="ai-review-loading-overlay"
            className="flex flex-col items-center justify-center gap-3 py-10 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-semibold">AI is reviewing your CV...</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Analyzing keyword alignment, experience relevance, resume structure, and ATS compatibility.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {currentAnalysis && (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5">
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">
                      Previous analysis available ({currentAnalysis.overallScore}/100)
                    </p>
                    <p className="text-muted-foreground">
                      Fit Level: {currentAnalysis.summary.fitLevel}
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
                    <span>View last Review</span>
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Job Title *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Senior Frontend Engineer"
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
                    <FormLabel>Job Description * (min 100 characters)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste the full job description, responsibilities, and required qualifications..."
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
                  Cancel
                </Button>
                <Button type="submit" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span>AI Review</span>
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

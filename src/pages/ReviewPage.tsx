import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  Award,
} from 'lucide-react';
import {
  Button,
  Checkbox,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/primitives';
import { AiReviewDialog } from '@/components/modals/AiReviewDialog';
import { useReviewStore } from '@/store/useResumeStore';
import { LanguageSwitcher, useLanguage } from '@/context/LanguageContext';

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 70) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function getScoreBarBg(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-amber-500';
  return 'bg-rose-500';
}

function CircularGauge({
  value,
  label,
  suffix = '',
}: {
  value: number;
  label: string;
  suffix?: string;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 85
      ? 'stroke-emerald-500'
      : clamped >= 70
      ? 'stroke-amber-500'
      : 'stroke-rose-500';

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/50"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="transparent"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${strokeColor}`}
          />
        </svg>
        <span className={`absolute text-xl font-extrabold ${getScoreColor(clamped)}`}>
          {clamped}
          {suffix}
        </span>
      </div>
      <span className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export default function ReviewPage() {
  const navigate = useNavigate();
  const { currentAnalysis } = useReviewStore();
  const [newReviewOpen, setNewReviewOpen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const { t } = useLanguage();

  if (!currentAnalysis) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">{t('reviewPage.noAnalysisTitle')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('reviewPage.noAnalysisDesc')}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('reviewPage.backToEditor')}
            </Button>
            <Button onClick={() => setNewReviewOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('reviewPage.startAnalysis')}
            </Button>
          </div>
        </div>
        <AiReviewDialog open={newReviewOpen} onOpenChange={setNewReviewOpen} />
      </div>
    );
  }

  const {
    overallScore,
    jobFitPercentage,
    summary,
    detailedAnalysis,
    recommendations,
    specificImprovements,
    nextSteps,
    estimatedImprovementTime,
  } = currentAnalysis;

  const categoryEntries = [
    {
      key: 'contentAlignment',
      label: t('reviewPage.categories.contentAlignment'),
      score: detailedAnalysis.contentAlignment.score,
      feedback: detailedAnalysis.contentAlignment.feedback,
      positives: detailedAnalysis.contentAlignment.matchingSkills,
      gaps: detailedAnalysis.contentAlignment.missingSkills,
    },
    {
      key: 'experienceRelevance',
      label: t('reviewPage.categories.experienceRelevance'),
      score: detailedAnalysis.experienceRelevance.score,
      feedback: detailedAnalysis.experienceRelevance.feedback,
      positives: detailedAnalysis.experienceRelevance.relevantExperience,
      gaps: detailedAnalysis.experienceRelevance.experienceGaps,
    },
    {
      key: 'resumeStructure',
      label: t('reviewPage.categories.resumeStructure'),
      score: detailedAnalysis.resumeStructure.score,
      feedback: detailedAnalysis.resumeStructure.feedback,
      positives: [t('reviewPage.resumeStructurePositive')],
      gaps: detailedAnalysis.resumeStructure.sectionsToImprove.map(
        (s) => `${s.sectionName}: ${s.improvement}`
      ),
    },
    {
      key: 'atsCompatibility',
      label: t('reviewPage.categories.atsCompatibility'),
      score: detailedAnalysis.atsCompatibility.score,
      feedback: detailedAnalysis.atsCompatibility.feedback,
      positives: [t('reviewPage.atsPositive')],
      gaps: detailedAnalysis.atsCompatibility.missingKeywords,
    },
  ];

  const toggleImprovementCheck = (id: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('reviewPage.backToEditor')}</span>
          </Button>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setNewReviewOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t('reviewPage.newAnalysis')}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {/* Gradient Header Banner */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('reviewPage.badge')}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('reviewPage.heading')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('reviewPage.subheading')}
            </p>
          </div>
        </div>

        {/* 3-Column Summary Metrics (`Overall Score`, `Job Fit`, `Candidate Level` + `estimatedImprovementTime`) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <CircularGauge value={overallScore} label={t('reviewPage.overallScore')} />
          <CircularGauge
            value={jobFitPercentage}
            label={t('reviewPage.jobFit')}
            suffix="%"
          />
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card p-5 text-center shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('reviewPage.candidateFitLevel')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-4 py-1.5 text-base font-bold text-primary">
              <Target className="h-4 w-4" />
              {summary.fitLevel}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t('reviewPage.estTime', { time: estimatedImprovementTime })}
            </span>
          </div>
        </div>

        {/* 4-Tab Dashboard (`Overview`, `Detailed Analysis`, `Recommendations`, `Improvements`) */}
        <Tabs defaultValue="overview" className="w-full space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 p-1 sm:grid-cols-4">
            <TabsTrigger value="overview" className="py-2 text-xs">
              {t('reviewPage.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="detailed-analysis" className="py-2 text-xs">
              {t('reviewPage.tabs.detailedAnalysis')}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="py-2 text-xs">
              {t('reviewPage.tabs.recommendations')}
            </TabsTrigger>
            <TabsTrigger value="improvements" className="py-2 text-xs">
              {t('reviewPage.tabs.improvements')}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryEntries.map((cat) => (
                <div
                  key={cat.key}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      {cat.label}
                    </span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        cat.score
                      )}`}
                    >
                      {cat.score}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full transition-all ${getScoreBarBg(
                        cat.score
                      )}`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-xs text-muted-foreground">
                    {cat.feedback}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <Award className="h-5 w-5 text-emerald-500" />
                  <span>{t('reviewPage.coreStrengths')}</span>
                </h2>
                <div className="space-y-2">
                  {summary.strengths.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3 text-xs"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span>{t('reviewPage.keyWeaknesses')}</span>
                </h2>
                <div className="space-y-2">
                  {summary.weaknesses.map((item: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-3 text-xs"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Detailed Analysis */}
          <TabsContent value="detailed-analysis" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {categoryEntries.map((cat) => (
                <div
                  key={cat.key}
                  className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="text-base font-bold">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">
                        {cat.feedback}
                      </p>
                    </div>
                    <span
                      className={`text-2xl font-extrabold ${getScoreColor(
                        cat.score
                      )}`}
                    >
                      {cat.score}%
                    </span>
                  </div>

                  {cat.positives.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {t('reviewPage.matchedStrengths')}
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        {cat.positives.map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cat.gaps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        {t('reviewPage.gapsSignals')}
                      </p>
                      <ul className="space-y-1.5 text-xs">
                        {cat.gaps.map((imp: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: Recommendations */}
          <TabsContent value="recommendations" className="space-y-6">
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold">
                  {t('reviewPage.prioritizedRecommendations')}
                </h2>
                <span className="inline-flex items-center gap-1 rounded bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {estimatedImprovementTime}
                </span>
              </div>

              <div className="space-y-3">
                {recommendations.highPriority.map((rec: string, i: number) => (
                  <div
                    key={`high-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5 text-xs"
                  >
                    <span>{rec}</span>
                    <span className="shrink-0 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">
                      {t('reviewPage.highPriority')}
                    </span>
                  </div>
                ))}
                {recommendations.mediumPriority.map(
                  (rec: string, i: number) => (
                    <div
                      key={`med-${i}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5 text-xs"
                    >
                      <span>{rec}</span>
                      <span className="shrink-0 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-600 dark:text-amber-400">
                        {t('reviewPage.mediumPriority')}
                      </span>
                    </div>
                  )
                )}
                {recommendations.lowPriority.map((rec: string, i: number) => (
                  <div
                    key={`low-${i}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3.5 text-xs"
                  >
                    <span>{rec}</span>
                    <span className="shrink-0 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">
                      {t('reviewPage.lowPriority')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <h3 className="mb-3 text-sm font-bold">{t('reviewPage.nextSteps')}</h3>
                <ol className="space-y-2">
                  {nextSteps.map((step: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 rounded-lg bg-muted/40 p-3 text-xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Improvements (with interactive strikethrough checkboxes) */}
          <TabsContent value="improvements" className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">
                    {t('reviewPage.checklistTitle')}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('reviewPage.checklistDesc')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(specificImprovements).map(
                  ([secName, suggestions]) => (
                    <div
                      key={secName}
                      className="space-y-3 rounded-lg border border-border p-4"
                    >
                      <span className="text-sm font-semibold">{secName}</span>
                      <div className="space-y-2.5">
                        {suggestions.map((sug: string, i: number) => {
                          const checkId = `${secName}-${i}`;
                          const isChecked = Boolean(checkedItems[checkId]);
                          return (
                            <label
                              key={checkId}
                              htmlFor={checkId}
                              className="flex cursor-pointer items-start gap-2.5 text-xs"
                            >
                              <Checkbox
                                id={checkId}
                                checked={isChecked}
                                onCheckedChange={() =>
                                  toggleImprovementCheck(checkId)
                                }
                                className="mt-0.5"
                              />
                              <span
                                className={
                                  isChecked
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                }
                              >
                                {sug}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AiReviewDialog open={newReviewOpen} onOpenChange={setNewReviewOpen} />
    </div>
  );
}

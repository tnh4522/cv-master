import React, { Component, Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { Toaster } from '@/components/ui/toast';
import { ThemeProvider } from '@/context/ThemeContext';
import { DialogProvider } from '@/context/DialogContext';
import {
  LanguageProvider,
  getInitialLanguage,
  translate,
  useLanguage,
} from '@/context/LanguageContext';
import { WorkspacePage } from '@/pages/WorkspacePage';

const ReviewPage = lazy(() => import('@/pages/ReviewPage'));

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('resumeData');
      localStorage.removeItem('sectionOrder');
      localStorage.removeItem('hiddenItemIds');
      localStorage.removeItem('pdfSetting');
      localStorage.removeItem('currentAnalysis');
    } finally {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const lang = getInitialLanguage();
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center text-foreground">
          <div className="max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-md">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-bold">{translate(lang, 'app.errorTitle')}</h1>
            <p className="text-xs text-muted-foreground">
              {this.state.error?.message || translate(lang, 'app.errorDescription')}
            </p>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={this.handleResetAndReload}
            >
              <RotateCcw className="h-4 w-4" />
              <span>{translate(lang, 'app.resetAndReload')}</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3">
        <img
          src="/logo.svg"
          alt="CV Master"
          className="h-10 w-10 animate-pulse"
        />
        <p className="text-xs font-medium text-muted-foreground">
          {t('app.loading')}
        </p>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <DialogProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<WorkspacePage />} />
                  <Route path="/review" element={<ReviewPage />} />
                </Routes>
              </Suspense>
              <Toaster />
            </BrowserRouter>
          </DialogProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;

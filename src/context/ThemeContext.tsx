import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light" | "system";

interface ThemeProviderContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = React.createContext<ThemeProviderContextValue>({
  theme: "system",
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "cv-master-theme",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  React.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      setThemeState(systemTheme);
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = React.useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: Theme) => {
        localStorage.setItem(storageKey, nextTheme);
        setThemeState(nextTheme);
      },
    }),
    [theme, storageKey]
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeSwitch({
  direction = "horizontal",
  orientation,
  variant = "both",
  size = "md",
  className,
}: {
  direction?: "horizontal" | "vertical";
  orientation?: "horizontal" | "vertical";
  variant?: "background" | "thumb" | "both";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const resolvedDirection = orientation ?? direction;
  const isVertical = resolvedDirection === "vertical";
  const showBg = variant === "background" || variant === "both";
  const showThumb = variant === "thumb" || variant === "both";

  const toggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const dims = {
    sm: {
      container: isVertical ? "h-12 w-6" : "h-6 w-12",
      thumb: "size-4",
      icon: "!size-2.5",
      bgIcon: "!size-2.5",
      translate: isVertical
        ? isDark
          ? "top-0 translate-y-7"
          : "top-0 translate-y-1"
        : isDark
          ? "left-0 translate-x-7"
          : "left-0 translate-x-1",
      padding: "p-0",
    },
    md: {
      container: isVertical ? "h-16 w-8" : "h-8 w-16",
      thumb: "size-6",
      icon: "!size-3",
      bgIcon: "!size-3",
      translate: isVertical
        ? isDark
          ? "top-0 translate-y-9"
          : "top-0 translate-y-1"
        : isDark
          ? "left-0 translate-x-9"
          : "left-0 translate-x-1",
      padding: "p-0",
    },
    lg: {
      container: isVertical ? "h-20 w-10" : "h-10 w-20",
      thumb: "size-8",
      icon: "!size-4",
      bgIcon: "!size-4",
      translate: isVertical
        ? isDark
          ? "top-0 translate-y-11"
          : "top-0 translate-y-1"
        : isDark
          ? "left-0 translate-x-11"
          : "left-0 translate-x-1",
      padding: "p-0",
    },
  }[size];

  return (
    <Button
      onClick={toggle}
      variant="ghost"
      className={cn(
        "relative inline-flex items-center rounded-full transition-all duration-300 border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background shadow-inner border bg-muted/80 dark:bg-primary",
        dims.container,
        isVertical && "flex-col",
        dims.padding,
        className
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {showBg && (
        <div
          className={cn(
            "absolute inset-1 flex items-center",
            isVertical ? "flex-col justify-between py-1.5" : "justify-between px-1"
          )}
        >
          <Sun
            className={cn(
              dims.bgIcon,
              "transition-all duration-300",
              isDark
                ? "text-secondary scale-90 opacity-60 rotate-0"
                : "text-secondary scale-0 opacity-0 -rotate-90"
            )}
          />
          <Moon
            className={cn(
              dims.bgIcon,
              "transition-all duration-300",
              isDark
                ? "text-accent-foreground scale-0 opacity-0 -rotate-90"
                : "text-accent-foreground scale-90 opacity-40 rotate-0"
            )}
          />
        </div>
      )}
      <span
        className={cn(
          "absolute z-10 inline-flex items-center justify-center transform rounded-full shadow-lg transition-all duration-300 ease-in-out bg-background dark:bg-primary-foreground",
          dims.thumb,
          dims.translate
        )}
      >
        {showThumb && (
          <>
            <Moon
              className={cn(
                dims.icon,
                "text-primary scale-0 hidden dark:block dark:scale-100 transition-all duration-300 ease-in-out"
              )}
            />
            <Sun
              className={cn(
                dims.icon,
                "text-primary scale-100 dark:hidden dark:scale-0 transition-all duration-300 ease-in-out"
              )}
            />
          </>
        )}
      </span>
    </Button>
  );
}

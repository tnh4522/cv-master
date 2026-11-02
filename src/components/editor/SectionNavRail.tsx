import React from 'react';
import { Button } from '@/components/ui/primitives';
import { SectionIcon } from '@/components/icons/CustomIcons';
import { ThemeSwitch } from '@/context/ThemeContext';
import { useResumeStore } from '@/store/useResumeStore';
import type { SectionKey } from '@/types/resume';

export function SectionNavRail() {
  const { sectionOrder, resumeData } = useResumeStore();
  const { sectionTitles } = resumeData;

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems: { id: 'basics' | SectionKey; label: string }[] = [
    { id: 'basics', label: 'Personal Information' },
    ...sectionOrder.map((key) => ({
      id: key,
      label: sectionTitles[key] || key,
    })),
  ];

  return (
    <aside className="hidden lg:flex lg:w-14 lg:flex-col lg:items-center lg:justify-between lg:border-r lg:border-border lg:bg-background lg:py-4">
      <nav
        aria-label="CV Sections Navigation"
        className="flex flex-col items-center gap-1.5"
      >
        {navItems.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            tooltipContent={item.label}
            onClick={() => scrollToSection(item.id)}
          >
            <SectionIcon section={item.id} className="h-4 w-4" />
          </Button>
        ))}
      </nav>

      <div className="flex flex-col items-center pt-4">
        <ThemeSwitch direction="vertical" />
      </div>
    </aside>
  );
}

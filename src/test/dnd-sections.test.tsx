import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import DndSections from '@/components/controls/DndSections';
import { SectionListEditor } from '@/components/editor/SectionListEditor';
import { ResumeSheet } from '@/components/preview/ResumeSheet';
import { useResumeStore, DEFAULT_SECTION_ORDER } from '@/store/useResumeStore';
import { DialogProvider } from '@/context/DialogContext';

describe('DndSections and Section Ordering', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
  });

  it('renders all sections in DndSections with reorder buttons', () => {
    render(<DndSections />);
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Reset Section Order|Khôi phục thứ tự mặc định/i })
    ).toBeInTheDocument();

    const upButtons = screen.getAllByRole('button', { name: /Move up|Di chuyển.*lên/i });
    const downButtons = screen.getAllByRole('button', { name: /Move down|Di chuyển.*xuống/i });
    expect(upButtons.length).toBe(DEFAULT_SECTION_ORDER.length);
    expect(downButtons.length).toBe(DEFAULT_SECTION_ORDER.length);

    // The first up button should be disabled
    expect(upButtons[0]).toBeDisabled();
    // The last down button should be disabled
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it('moves a section down when clicking the down button', () => {
    render(<DndSections />);
    const downButtons = screen.getAllByRole('button', { name: /Move down|Di chuyển.*xuống/i });

    // Click down on the first item ('Summary')
    fireEvent.click(downButtons[0]);

    const order = useResumeStore.getState().sectionOrder;
    expect(order[0]).toBe('experience');
    expect(order[1]).toBe('summary');
  });

  it('moves a section up when clicking the up button', () => {
    render(<DndSections />);
    const upButtons = screen.getAllByRole('button', { name: /Move up|Di chuyển.*lên/i });

    // Click up on the second item ('Experience')
    fireEvent.click(upButtons[1]);

    const order = useResumeStore.getState().sectionOrder;
    expect(order[0]).toBe('experience');
    expect(order[1]).toBe('summary');
  });

  it('resets section order to default when clicking reset button', () => {
    render(<DndSections />);
    const downButtons = screen.getAllByRole('button', { name: /Move down|Di chuyển.*xuống/i });
    fireEvent.click(downButtons[0]);

    expect(useResumeStore.getState().sectionOrder[0]).toBe('experience');

    const resetBtn = screen.getByRole('button', {
      name: /Reset Section Order|Khôi phục thứ tự mặc định/i,
    });
    fireEvent.click(resetBtn);

    expect(useResumeStore.getState().sectionOrder).toEqual(DEFAULT_SECTION_ORDER);
  });

  it('renders section headings in ResumeSheet in the exact order of sectionOrder', () => {
    const { container } = render(<ResumeSheet mode="preview" />);
    
    const headings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Summary',
      'Experience',
      'Projects',
      'Education',
      'Skills',
      'Soft Skills',
      'Languages',
    ]);

    act(() => {
      useResumeStore.getState().updateSectionOrder([
        'education',
        'skills',
        'summary',
        'experience',
        'projects',
        'softSkills',
        'languages',
        'certifications',
        'awards',
        'volunteering',
        'interests',
      ]);
    });

    const reorderedHeadings = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(reorderedHeadings).toEqual([
      'Education',
      'Skills',
      'Summary',
      'Experience',
      'Projects',
      'Soft Skills',
      'Languages',
    ]);
  });
});

describe('SectionListEditor Item Reordering', () => {
  beforeEach(() => {
    localStorage.clear();
    useResumeStore.getState().resetResume();
    // Set up sample multiple items in skills
    act(() => {
      useResumeStore.getState().setData({
        interests: [
          { id: 'int-1', name: 'IT Operations', description: 'Tech Support', keywords: ['Support'] },
          { id: 'int-2', name: 'Networking', description: 'Infrastructure', keywords: ['Cisco'] },
          { id: 'int-3', name: 'Open Source', description: 'Linux', keywords: ['Kernel'] },
        ],
      });
    });
  });

  it('renders items with drag handles and move up/down buttons', () => {
    render(
      <DialogProvider>
        <SectionListEditor sectionKey="interests" />
      </DialogProvider>
    );

    expect(screen.getByText('IT Operations')).toBeInTheDocument();
    expect(screen.getByText('Networking')).toBeInTheDocument();
    expect(screen.getByText('Open Source')).toBeInTheDocument();

    const upButtons = screen.getAllByRole('button', { name: /Move up|Di chuyển.*lên/i });
    const downButtons = screen.getAllByRole('button', { name: /Move down|Di chuyển.*xuống/i });

    expect(upButtons.length).toBe(3);
    expect(downButtons.length).toBe(3);

    // First item up button should be disabled
    expect(upButtons[0]).toBeDisabled();
    // Last item down button should be disabled
    expect(downButtons[2]).toBeDisabled();
  });

  it('moves an item down when clicking its down button', () => {
    render(
      <DialogProvider>
        <SectionListEditor sectionKey="interests" />
      </DialogProvider>
    );

    const downButtons = screen.getAllByRole('button', { name: /Move down|Di chuyển.*xuống/i });
    // Click down on the first item ('IT Operations')
    fireEvent.click(downButtons[0]);

    const interests = useResumeStore.getState().resumeData.interests;
    expect(interests?.[0].name).toBe('Networking');
    expect(interests?.[1].name).toBe('IT Operations');
    expect(interests?.[2].name).toBe('Open Source');
  });

  it('moves an item up when clicking its up button', () => {
    render(
      <DialogProvider>
        <SectionListEditor sectionKey="interests" />
      </DialogProvider>
    );

    const upButtons = screen.getAllByRole('button', { name: /Move up|Di chuyển.*lên/i });
    // Click up on the second item ('Networking')
    fireEvent.click(upButtons[1]);

    const interests = useResumeStore.getState().resumeData.interests;
    expect(interests?.[0].name).toBe('Networking');
    expect(interests?.[1].name).toBe('IT Operations');
    expect(interests?.[2].name).toBe('Open Source');
  });

  it('reorders items using reorderSectionItems store method and reflects in ResumeSheet', () => {
    const store = useResumeStore.getState();
    const originalInterests = store.resumeData.interests || [];

    act(() => {
      store.reorderSectionItems('interests', [
        originalInterests[2],
        originalInterests[0],
        originalInterests[1],
      ]);
    });

    const updated = useResumeStore.getState().resumeData.interests;
    expect(updated?.[0].name).toBe('Open Source');
    expect(updated?.[1].name).toBe('IT Operations');
    expect(updated?.[2].name).toBe('Networking');

    // Check preview rendering
    const { container } = render(<ResumeSheet mode="preview" />);
    expect(container.textContent).toContain('Open Source');
  });
});

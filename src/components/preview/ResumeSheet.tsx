import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Mail, Globe, Phone, MapPin } from 'lucide-react';
import { CustomFieldIcon, LinkedInIcon } from '@/components/icons/CustomIcons';
import { usePdfSettingsStore, useResumeStore } from '@/store/useResumeStore';
import { loadFontStylesheet } from '@/services/fontsService';
import { A4_HEIGHT_PX, A4_WIDTH_PX } from '@/lib/utils';
import type { SectionKey } from '@/types/resume';
import { useLanguage } from '@/context/LanguageContext';

const VERTICAL_SPACING_CLASSES: Record<number, string> = {
  1: 'space-y-1',
  2: 'space-y-2',
  3: 'space-y-3',
  4: 'space-y-4',
  5: 'space-y-5',
  6: 'space-y-6',
  7: 'space-y-7',
  8: 'space-y-8',
  9: 'space-y-9',
  10: 'space-y-10',
};

export function sanitizeSummaryHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(?:"\s*(?:javascript|vbscript|data:text\/html)[^"]*"|'\s*(?:javascript|vbscript|data:text\/html)[^']*')/gi, '$1="#"')
    .replace(/• /g, '')
    .trim();
}

function isEmptyRichText(html?: string): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]+>/g, '').trim();
  return text.length === 0;
}

function isUrlValue(val: string): boolean {
  return /^(https?:\/\/|www\.)/i.test(val.trim());
}

export function normalizeHref(val: string): string {
  const trimmed = val.trim();
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return '#';
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isSafePhotoUrl(url?: string): boolean {
  if (!url) return false;
  return /^(https?:\/\/|data:image\/|blob:)/i.test(url.trim());
}

export interface ResumeSheetProps {
  mode?: 'preview' | 'print';
}

export const ResumeSheet = forwardRef<HTMLDivElement, ResumeSheetProps>(
  ({ mode = 'preview' }, forwardedRef) => {
    const { resumeData, sectionOrder, hiddenItemIds } = useResumeStore();
    const { pdfSettings } = usePdfSettingsStore();
    const { t } = useLanguage();
    const internalRef = useRef<HTMLDivElement | null>(null);
    const [sheetHeight, setSheetHeight] = useState<number>(A4_HEIGHT_PX);

    const {
      fontSize,
      fontFamily,
      lineHeight,
      verticalSpacing,
      margin,
      pageBreakLine,
      skillsLayout,
    } = pdfSettings;

    const { basics, sectionTitles } = resumeData;
    const lineHeightStyle = `${lineHeight * 0.25}rem`;
    const spacingClass =
      VERTICAL_SPACING_CLASSES[verticalSpacing] || 'space-y-2';

    useEffect(() => {
      if (fontFamily) {
        loadFontStylesheet(fontFamily);
      }
    }, [fontFamily]);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const updateHeight = () => {
        const measured = Math.max(el.offsetHeight || 0, el.scrollHeight || 0);
        setSheetHeight(measured > 0 ? measured : A4_HEIGHT_PX);
      };
      updateHeight();

      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(updateHeight);
      observer.observe(el);
      return () => observer.disconnect();
    }, [resumeData, pdfSettings, hiddenItemIds, sectionOrder]);

    const setRefs = (node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const totalPages = Math.max(1, Math.ceil(sheetHeight / A4_HEIGHT_PX));

    const alignmentJustifyClass =
      basics.alignment === 'center'
        ? 'justify-center text-center'
        : basics.alignment === 'end'
        ? 'justify-end text-right'
        : 'justify-start text-left';

    const alignmentItemsClass =
      basics.alignment === 'center'
        ? 'items-center text-center'
        : basics.alignment === 'end'
        ? 'items-end text-right'
        : 'items-start text-left';

    const renderSection = (key: SectionKey) => {
      const headingStyle: React.CSSProperties = {
        fontSize: `${fontSize + 4}px`,
      };

      if (key === 'summary') {
        const content = resumeData.summary?.content || '';
        if (isEmptyRichText(content)) return null;
        return (
          <div key="summary" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.summary ||
                resumeData.summary?.sectionTitle ||
                'Summary'}
            </h3>
            <div
              className="preview text-neutral-800"
              style={{ lineHeight: lineHeightStyle }}
              dangerouslySetInnerHTML={{
                __html: sanitizeSummaryHtml(content),
              }}
            />
          </div>
        );
      }

      if (key === 'experience') {
        const items = resumeData.experience.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="experience" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.experience || 'Experience'}
            </h3>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-neutral-900">
                      {item.website ? (
                        <a
                          href={normalizeHref(item.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                      {item.employmentType && (
                        <span className="ml-1.5 font-normal text-neutral-600">
                          • {item.employmentType}
                        </span>
                      )}
                    </div>
                    {item.dateRange && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.dateRange}
                      </span>
                    )}
                  </div>
                  {(item.position || item.location) && (
                    <div className="flex items-baseline justify-between gap-2 text-neutral-700">
                      <span className="italic">{item.position}</span>
                      {item.location && (
                        <span className="shrink-0 whitespace-nowrap">{item.location}</span>
                      )}
                    </div>
                  )}
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'projects') {
        const items = resumeData.projects.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="projects" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.projects || 'Projects'}
            </h3>
            <div className="space-y-2.5">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-neutral-900">
                      {item.website ? (
                        <a
                          href={normalizeHref(item.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                      {item.description && (
                        <span className="ml-1.5 font-normal text-neutral-700">
                          — {item.description}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                  {item.keywords && item.keywords.length > 0 && (
                    <p
                      className="text-neutral-700"
                      style={{ lineHeight: lineHeightStyle }}
                    >
                      <span className="font-semibold">Technologies: </span>
                      {item.keywords.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'education') {
        const items = resumeData.education.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="education" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.education || 'Education'}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-neutral-900">
                      {item.website ? (
                        <a
                          href={normalizeHref(item.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                    </div>
                    {item.date && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {(item.degree || item.studyField) && (
                    <div className="text-neutral-700">
                      <span>{item.degree}</span>
                      {item.degree && item.studyField && <span> in </span>}
                      <span>{item.studyField}</span>
                    </div>
                  )}
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'skills') {
        const items = resumeData.skills.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        const skillsLayoutClass =
          skillsLayout === 'grid-col'
            ? 'grid grid-cols-2 gap-x-6 gap-y-1.5'
            : skillsLayout === 'grid-row'
            ? 'grid grid-cols-1 gap-y-1.5'
            : 'flex flex-wrap gap-x-6 gap-y-1';
        return (
          <div key="skills" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.skills || 'Skills'}
            </h3>
            <div data-testid="skills-layout-container" className={skillsLayoutClass}>
              {items.map((item) => (
                <div
                  key={item.id}
                  data-resume-entry="true"
                  className="text-neutral-800"
                  style={{ lineHeight: lineHeightStyle }}
                >
                  {item.name && (
                    <span className="font-semibold text-neutral-900">
                      {item.name}:{' '}
                    </span>
                  )}
                  <span>{item.keywords.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'languages') {
        const items = resumeData.languages.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        const hasExtendedDetails = items.some(
          (item) =>
            item.certificate ||
            item.score ||
            item.date ||
            item.website ||
            item.listening ||
            item.speaking ||
            item.reading ||
            item.writing ||
            item.description
        );
        return (
          <div key="languages" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.languages || 'Languages'}
            </h3>
            <div
              className={
                hasExtendedDetails
                  ? 'space-y-1.5'
                  : 'flex flex-wrap gap-x-6 gap-y-1'
              }
            >
              {items.map((item) => {
                const skillBreakdown = [
                  item.listening && `Listening: ${item.listening}`,
                  item.speaking && `Speaking: ${item.speaking}`,
                  item.reading && `Reading: ${item.reading}`,
                  item.writing && `Writing: ${item.writing}`,
                ].filter(Boolean);
                const certText = [item.certificate, item.score]
                  .filter(Boolean)
                  .join(': ');

                return (
                  <div
                    key={item.id}
                    data-resume-entry="true"
                    className="text-neutral-800"
                    style={{ lineHeight: lineHeightStyle }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        {item.website ? (
                          <a
                            href={normalizeHref(item.website)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-neutral-900 underline decoration-neutral-400 underline-offset-2"
                          >
                            {item.name}
                          </a>
                        ) : (
                          <span className="font-semibold text-neutral-900">
                            {item.name}
                          </span>
                        )}
                        {item.level && (
                          <span className="text-neutral-700">
                            {' '}
                            — {item.level}
                          </span>
                        )}
                        {certText && (
                          <span className="text-neutral-700">
                            {' '}
                            • {certText}
                          </span>
                        )}
                      </div>
                      {item.date && (
                        <span className="shrink-0 whitespace-nowrap text-neutral-700">
                          {item.date}
                        </span>
                      )}
                    </div>
                    {skillBreakdown.length > 0 && (
                      <div className="text-neutral-700">
                        {skillBreakdown.join(' • ')}
                      </div>
                    )}
                    {item.description && (
                      <div className="text-neutral-700">{item.description}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (key === 'certifications') {
        const items = resumeData.certifications.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="certifications" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.certifications || 'Certifications'}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-neutral-900">
                      {item.website ? (
                        <a
                          href={normalizeHref(item.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                      {item.issuer && (
                        <span className="ml-1.5 font-normal text-neutral-700">
                          — {item.issuer}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'awards') {
        const items = resumeData.awards.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="awards" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.awards || 'Awards'}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-neutral-900">
                      {item.website ? (
                        <a
                          href={normalizeHref(item.website)}
                          target="_blank"
                          rel="noreferrer"
                          className="underline decoration-neutral-400 underline-offset-2"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <span>{item.name}</span>
                      )}
                      {item.issuer && (
                        <span className="ml-1.5 font-normal text-neutral-700">
                          — {item.issuer}
                        </span>
                      )}
                    </div>
                    {item.date && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'volunteering') {
        const items = resumeData.volunteering.filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="volunteering" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.volunteering || 'Volunteering'}
            </h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} data-resume-entry="true" className="space-y-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-neutral-900">
                      {item.name}
                    </span>
                    {item.date && (
                      <span className="shrink-0 whitespace-nowrap text-neutral-700">
                        {item.date}
                      </span>
                    )}
                  </div>
                  {(item.position || item.location) && (
                    <div className="flex items-baseline justify-between gap-2 text-neutral-700">
                      <span className="italic">{item.position}</span>
                      {item.location && (
                        <span className="shrink-0 whitespace-nowrap">{item.location}</span>
                      )}
                    </div>
                  )}
                  {!isEmptyRichText(item.summary) && (
                    <div
                      className="preview pt-0.5 text-neutral-800"
                      style={{ lineHeight: lineHeightStyle }}
                      dangerouslySetInnerHTML={{
                        __html: sanitizeSummaryHtml(item.summary),
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (key === 'interests') {
        const items = (resumeData.interests || []).filter(
          (item) => !hiddenItemIds.includes(item.id)
        );
        if (items.length === 0) return null;
        return (
          <div key="interests" className="w-full">
            <h3
              className="mb-1 border-b border-neutral-400 font-bold text-neutral-900"
              style={headingStyle}
            >
              {sectionTitles.interests || 'Interests'}
            </h3>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  data-resume-entry="true"
                  className="text-neutral-800"
                  style={{ lineHeight: lineHeightStyle }}
                >
                  <span className="font-semibold text-neutral-900">
                    {item.name}
                  </span>
                  {item.description && (
                    <span className="text-neutral-700">
                      {' '}
                      — {item.description}
                    </span>
                  )}
                  {item.keywords && item.keywords.length > 0 && (
                    <span className="text-neutral-700">
                      {item.description
                        ? ` (${item.keywords.join(', ')})`
                        : `: ${item.keywords.join(', ')}`}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }

      return null;
    };

    const showPhoto = isSafePhotoUrl(basics.photo.url) && basics.photo.visible;

    return (
      <div
        ref={setRefs}
        data-testid="resume-sheet"
        className={`resume-sheet relative flex flex-col bg-white text-neutral-900 ${
          mode === 'preview' ? 'shadow-xl' : 'shadow-none'
        }`}
        style={{
          width: mode === 'preview' ? `${A4_WIDTH_PX}px` : '100%',
          minWidth: mode === 'preview' ? `${A4_WIDTH_PX}px` : '100%',
          minHeight: mode === 'preview' ? `${A4_HEIGHT_PX}px` : 'auto',
          fontSize: `${fontSize}px`,
          fontFamily: `"${fontFamily}", sans-serif`,
          padding:
            mode === 'preview'
              ? `${margin.VALUE}px`
              : `0px ${margin.VALUE}px`,
        }}
      >
        <div className={`flex flex-1 flex-col w-full preview ${spacingClass}`}>
          {/* Personal Information Header */}
          <header
            className={`flex gap-4 ${
              basics.alignment === 'center'
                ? 'flex-col items-center text-center'
                : basics.alignment === 'end'
                ? 'flex-row-reverse items-center justify-between text-right'
                : 'flex-row items-center justify-between text-left'
            }`}
          >
            {showPhoto && (
              <img
                src={basics.photo.url}
                alt={basics.name || 'Profile'}
                className="shrink-0 object-cover"
                style={{
                  width: `${basics.photo.size}px`,
                  height: `${basics.photo.size}px`,
                  borderRadius: `${basics.photo.borderRadius}px`,
                }}
              />
            )}

            <div className={`flex flex-1 flex-col ${alignmentItemsClass}`}>
              {basics.name && (
                <h1
                  className="font-bold tracking-tight text-neutral-900"
                  style={{ fontSize: `${fontSize + 10}px`, lineHeight: 1.2 }}
                >
                  {basics.name}
                </h1>
              )}
              {basics.title && (
                <p
                  className="font-medium text-neutral-700"
                  style={{ fontSize: `${fontSize + 2}px` }}
                >
                  {basics.title}
                </p>
              )}

              {/* Contact Items Row */}
              <div
                className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-700 ${alignmentJustifyClass}`}
                style={{ fontSize: `${Math.max(10, fontSize - 1)}px` }}
              >
                {basics.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                    <a
                      href={`mailto:${basics.email}`}
                      className="hover:underline"
                    >
                      {basics.email}
                    </a>
                  </span>
                )}

                {basics.linkedin && (
                  <span className="inline-flex items-center gap-1">
                    <LinkedInIcon size={14} />
                    <a
                      href={normalizeHref(basics.linkedin)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {basics.linkedin.replace(/^https?:\/\/(www\.)?/i, '')}
                    </a>
                  </span>
                )}

                {basics.website && (
                  <span className="inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                    <a
                      href={normalizeHref(basics.website)}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {basics.website.replace(/^https?:\/\/(www\.)?/i, '')}
                    </a>
                  </span>
                )}

                {basics.phone?.value && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                      <span>{basics.phone.value}</span>
                    </span>
                    {basics.phone.breakAfter && <div className="basis-full h-0" />}
                  </>
                )}

                {basics.location?.value && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-600" />
                      <span>{basics.location.value}</span>
                    </span>
                    {basics.location.breakAfter && (
                      <div className="basis-full h-0" />
                    )}
                  </>
                )}

                {basics.customFields?.map((field) => {
                  if (!field.name && !field.value) return null;
                  const display = field.name || field.value;
                  return (
                    <React.Fragment key={field.id}>
                      <span className="inline-flex items-center gap-1">
                        <CustomFieldIcon
                          iconName={field.iconName}
                          size={14}
                          className="shrink-0 text-neutral-600"
                        />
                        {isUrlValue(field.value) ? (
                          <a
                            href={normalizeHref(field.value)}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline"
                          >
                            {display}
                          </a>
                        ) : (
                          <span>
                            {field.name && field.value
                              ? `${field.name}: ${field.value}`
                              : display}
                          </span>
                        )}
                      </span>
                      {field.breakAfter && <div className="basis-full h-0" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </header>

          {/* Ordered CV Sections */}
          {sectionOrder.map((sectionKey) => renderSection(sectionKey))}
        </div>

        {/* Multi-page A4 Break Lines (Preview mode only) */}
        {mode === 'preview' &&
          pageBreakLine &&
          totalPages > 1 &&
          Array.from({ length: totalPages - 1 }).map((_, idx) => {
            const topOffset = (idx + 1) * A4_HEIGHT_PX + margin.VALUE / 2;
            return (
              <div
                key={idx}
                data-page-break-indicator="true"
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-center"
                style={{ top: `${topOffset}px` }}
              >
                <hr className="w-full border-t-2 border-dashed border-rose-500/70" />
                <span className="absolute rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  {t('canvas.pageStarts', { page: idx + 2 })}
                </span>
              </div>
            );
          })}
      </div>
    );
  }
);
ResumeSheet.displayName = 'ResumeSheet';

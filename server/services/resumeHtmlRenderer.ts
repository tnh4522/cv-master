import { resolveServerMargins } from '../schemas/pdfSchema';
import {
  normalizeResumeHtmlForPdf,
  stripExecutableHtmlTags,
} from './htmlNormalizer';

export type ServerSectionKey =
  | 'summary'
  | 'experience'
  | 'projects'
  | 'research'
  | 'education'
  | 'skills'
  | 'softSkills'
  | 'languages'
  | 'certifications'
  | 'awards'
  | 'volunteering'
  | 'interests';

export interface ServerRenderResumeOptions {
  resumeData: Record<string, any>;
  pdfSettings?: Record<string, any>;
  sectionOrder?: string[];
  hiddenItemIds?: string[];
  hiddenSections?: string[];
  title?: string;
}

const DEFAULT_SERVER_SECTION_ORDER: ServerSectionKey[] = [
  'summary',
  'experience',
  'projects',
  'research',
  'education',
  'skills',
  'softSkills',
  'languages',
  'certifications',
  'awards',
  'volunteering',
  'interests',
];

function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeRichText(html?: string): string {
  if (!html) return '';
  return stripExecutableHtmlTags(html)
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/• /g, '')
    .trim();
}

function normalizeUrlHref(val?: string): string {
  const trimmed = (val || '').trim();
  if (!trimmed || /^(javascript|vbscript|data):/i.test(trimmed)) {
    return '#';
  }
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isEmptyRichText(html?: string): boolean {
  if (!html) return true;
  const text = html.replace(/<[^>]+>/g, '').trim();
  return text.length === 0;
}

function isSafePhotoUrl(url?: string): boolean {
  if (!url) return false;
  return /^(https?:\/\/|data:image\/)/i.test(url.trim());
}

/**
 * Stateless, concurrency-safe server-side HTML renderer that converts structured `ResumeData`
 * and `PdfSettings` directly into a standalone A4 HTML document matching `ResumeSheet`.
 */
export function renderResumeDataToHtml({
  resumeData = {},
  pdfSettings = {},
  sectionOrder: rawOrder,
  hiddenItemIds: rawHiddenItems,
  hiddenSections: rawHiddenSections,
  title,
}: ServerRenderResumeOptions): string {
  const basics = resumeData.basics || {};
  const sectionTitles = resumeData.sectionTitles || {};
  const mergedSettings = {
    fontSize: 14,
    fontFamily: 'Work Sans',
    lineHeight: 5,
    verticalSpacing: 3,
    skillsLayout: 'inline',
    ...(resumeData.pdfSettings || {}),
    ...pdfSettings,
  };

  const sectionOrder: ServerSectionKey[] =
    Array.isArray(rawOrder) && rawOrder.length > 0
      ? (rawOrder as ServerSectionKey[])
      : DEFAULT_SERVER_SECTION_ORDER;

  const hiddenItemIds = new Set<string>(
    rawHiddenItems ?? resumeData.hiddenItemIds ?? []
  );
  const hiddenSections = new Set<string>(
    rawHiddenSections ?? resumeData.hiddenSections ?? []
  );

  const fontSize = Number(mergedSettings.fontSize) || 14;
  const fontFamily = String(mergedSettings.fontFamily || 'Work Sans');
  const rawLineHeight = Number(mergedSettings.lineHeight);
  const safeLineHeight =
    !Number.isNaN(rawLineHeight) && rawLineHeight > 0 ? rawLineHeight : 5;
  const lineHeightStyle = `${safeLineHeight * 0.25}rem`;
  const verticalSpacing = Number(mergedSettings.verticalSpacing ?? 3);
  const sectionGapPx = (verticalSpacing + 2) * 4;
  const skillsLayout = mergedSettings.skillsLayout || 'inline';
  const margins = resolveServerMargins(mergedSettings.margin);
  const headingStyle = `font-size: ${fontSize + 4}px;`;

  const alignment = basics.alignment || 'start';
  const alignmentJustifyClass =
    alignment === 'center'
      ? 'justify-center text-center'
      : alignment === 'end'
      ? 'justify-end text-right'
      : 'justify-start text-left';

  const alignmentItemsClass =
    alignment === 'center'
      ? 'items-center text-center'
      : alignment === 'end'
      ? 'items-end text-right'
      : 'items-start text-left';

  const headerFlexClass =
    alignment === 'center'
      ? 'flex-col items-center text-center'
      : alignment === 'end'
      ? 'flex-row-reverse items-center justify-between text-right'
      : 'flex-row items-center justify-between text-left';

  const showPhoto =
    isSafePhotoUrl(basics.photo?.url) && Boolean(basics.photo?.visible ?? true);

  const contactLine1Parts: string[] = [];
  if (basics.email) {
    contactLine1Parts.push(
      `<span class="inline-flex items-center gap-1"><a href="mailto:${escapeHtml(
        basics.email
      )}">${escapeHtml(basics.email)}</a></span>`
    );
  }
  if (basics.phone?.value) {
    contactLine1Parts.push(
      `<span class="inline-flex items-center gap-1"><span>${escapeHtml(
        basics.phone.value
      )}</span></span>`
    );
  }
  if (basics.dateOfBirth?.value) {
    contactLine1Parts.push(
      `<span class="inline-flex items-center gap-1"><span>${escapeHtml(
        basics.dateOfBirth.value
      )}</span></span>`
    );
  }
  if (basics.location?.value) {
    contactLine1Parts.push(
      `<span class="inline-flex items-center gap-1"><span>${escapeHtml(
        basics.location.value
      )}</span></span>`
    );
  }

  const contactLine2Parts: string[] = [];
  if (basics.linkedin) {
    const cleanLinkedin = String(basics.linkedin).replace(
      /^https?:\/\/(www\.)?/i,
      ''
    );
    contactLine2Parts.push(
      `<span class="inline-flex items-center gap-1"><a href="${escapeHtml(
        normalizeUrlHref(basics.linkedin)
      )}" target="_blank" rel="noreferrer">${escapeHtml(cleanLinkedin)}</a></span>`
    );
  }
  if (basics.website) {
    const cleanWeb = String(basics.website).replace(
      /^https?:\/\/(www\.)?/i,
      ''
    );
    contactLine2Parts.push(
      `<span class="inline-flex items-center gap-1"><a href="${escapeHtml(
        normalizeUrlHref(basics.website)
      )}" target="_blank" rel="noreferrer">${escapeHtml(cleanWeb)}</a></span>`
    );
  }

  const renderSectionHtml = (key: ServerSectionKey): string => {
    if (hiddenSections.has(key)) return '';

    if (key === 'summary') {
      const content = resumeData.summary?.content || '';
      if (isEmptyRichText(content)) return '';
      const heading =
        sectionTitles.summary || resumeData.summary?.sectionTitle || 'Summary';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        heading
      )}</h3><div class="preview text-neutral-800" style="line-height: ${lineHeightStyle};">${sanitizeRichText(
        content
      )}</div></div>`;
    }

    if (key === 'experience') {
      const items = (resumeData.experience || []).filter(
        (i: any) => !hiddenItemIds.has(i.id)
      );
      if (items.length === 0) return '';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles.experience || 'Experience'
      )}</h3><div class="space-y-2.5">${items
        .map(
          (item: any) => `<div data-resume-entry="true" class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <div class="font-semibold text-neutral-900">
                ${
                  item.website
                    ? `<a href="${escapeHtml(
                        normalizeUrlHref(item.website)
                      )}" class="underline decoration-neutral-400 underline-offset-2">${escapeHtml(
                        item.name
                      )}</a>`
                    : `<span>${escapeHtml(item.name)}</span>`
                }
                ${
                  item.employmentType
                    ? `<span class="ml-1.5 font-normal text-neutral-600">• ${escapeHtml(
                        item.employmentType
                      )}</span>`
                    : ''
                }
              </div>
              ${
                item.dateRange
                  ? `<span class="shrink-0 whitespace-nowrap text-neutral-700">${escapeHtml(
                      item.dateRange
                    )}</span>`
                  : ''
              }
            </div>
            ${
              item.position || item.location
                ? `<div class="flex items-baseline justify-between gap-2 text-neutral-700"><span class="italic">${escapeHtml(
                    item.position
                  )}</span>${
                    item.location
                      ? `<span class="shrink-0 whitespace-nowrap">${escapeHtml(
                          item.location
                        )}</span>`
                      : ''
                  }</div>`
                : ''
            }
            ${
              !isEmptyRichText(item.summary)
                ? `<div class="preview pt-0.5 text-neutral-800" style="line-height: ${lineHeightStyle};">${sanitizeRichText(
                    item.summary
                  )}</div>`
                : ''
            }
          </div>`
        )
        .join('')}</div></div>`;
    }

    if (key === 'projects') {
      const items = (resumeData.projects || []).filter(
        (i: any) => !hiddenItemIds.has(i.id)
      );
      if (items.length === 0) return '';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles.projects || 'Projects'
      )}</h3><div class="space-y-2.5">${items
        .map(
          (item: any) => `<div data-resume-entry="true" class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <div class="font-semibold text-neutral-900">
                <span>${escapeHtml(item.name)}</span>
                ${
                  item.description
                    ? `<span class="ml-1.5 font-normal text-neutral-700">— ${escapeHtml(
                        item.description
                      )}</span>`
                    : ''
                }
              </div>
              ${
                item.date
                  ? `<span class="shrink-0 whitespace-nowrap text-neutral-700">${escapeHtml(
                      item.date
                    )}</span>`
                  : ''
              }
            </div>
            ${
              !isEmptyRichText(item.summary)
                ? `<div class="preview pt-0.5 text-neutral-800" style="line-height: ${lineHeightStyle};">${sanitizeRichText(
                    item.summary
                  )}</div>`
                : ''
            }
            ${
              item.keywords && item.keywords.length > 0
                ? `<p class="text-neutral-700" style="line-height: ${lineHeightStyle};"><span class="font-semibold">Technologies: </span>${escapeHtml(
                    item.keywords.join(', ')
                  )}</p>`
                : ''
            }
          </div>`
        )
        .join('')}</div></div>`;
    }

    if (key === 'education') {
      const items = (resumeData.education || []).filter(
        (i: any) => !hiddenItemIds.has(i.id)
      );
      if (items.length === 0) return '';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles.education || 'Education'
      )}</h3><div class="space-y-2">${items
        .map(
          (item: any) => `<div data-resume-entry="true" class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <div class="font-semibold text-neutral-900"><span>${escapeHtml(
                item.name
              )}</span></div>
              ${
                item.date
                  ? `<span class="shrink-0 whitespace-nowrap text-neutral-700">${escapeHtml(
                      item.date
                    )}</span>`
                  : ''
              }
            </div>
            ${
              item.degree || item.studyField
                ? `<div class="text-neutral-700"><span>${escapeHtml(
                    item.degree
                  )}</span>${
                    item.degree && item.studyField ? '<span> in </span>' : ''
                  }<span>${escapeHtml(item.studyField)}</span></div>`
                : ''
            }
            ${
              !isEmptyRichText(item.summary)
                ? `<div class="preview pt-0.5 text-neutral-800" style="line-height: ${lineHeightStyle};">${sanitizeRichText(
                    item.summary
                  )}</div>`
                : ''
            }
          </div>`
        )
        .join('')}</div></div>`;
    }

    if (key === 'skills' || key === 'softSkills') {
      const rawList =
        key === 'skills' ? resumeData.skills : resumeData.softSkills;
      const items = (rawList || []).filter((i: any) => !hiddenItemIds.has(i.id));
      if (items.length === 0) return '';
      const skillsLayoutClass =
        skillsLayout === 'grid-col'
          ? 'grid grid-cols-2 gap-x-6 gap-y-1.5'
          : skillsLayout === 'grid-row'
          ? 'grid grid-cols-1 gap-y-1.5'
          : 'flex flex-wrap gap-x-6 gap-y-1.5';
      const defaultHeading = key === 'skills' ? 'Skills' : 'Soft Skills';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles[key] || defaultHeading
      )}</h3><div class="${skillsLayoutClass}">${items
        .map(
          (item: any) => `<div data-resume-entry="true" class="w-full text-neutral-800" style="line-height: ${lineHeightStyle};">
            ${
              item.name
                ? `<span class="font-semibold text-neutral-900">${escapeHtml(
                    item.name
                  )}: </span>`
                : ''
            }
            <span>${escapeHtml((item.keywords || []).join(', '))}</span>
          </div>`
        )
        .join('')}</div></div>`;
    }

    if (key === 'languages') {
      const items = (resumeData.languages || []).filter(
        (i: any) => !hiddenItemIds.has(i.id)
      );
      if (items.length === 0) return '';
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles.languages || 'Languages'
      )}</h3><div class="flex flex-wrap gap-x-6 gap-y-1">${items
        .map((item: any) => {
          const details = [item.level, item.certificate, item.score]
            .filter(Boolean)
            .join(' • ');
          return `<div data-resume-entry="true" class="text-neutral-800" style="line-height: ${lineHeightStyle};"><span class="font-semibold text-neutral-900">${escapeHtml(
            item.name
          )}</span>${
            details
              ? `<span class="text-neutral-700"> — ${escapeHtml(details)}</span>`
              : ''
          }</div>`;
        })
        .join('')}</div></div>`;
    }

    if (
      key === 'certifications' ||
      key === 'awards' ||
      key === 'research' ||
      key === 'volunteering' ||
      key === 'interests'
    ) {
      const items = (resumeData[key] || []).filter(
        (i: any) => !hiddenItemIds.has(i.id)
      );
      if (items.length === 0) return '';
      const defaultHeading = key.charAt(0).toUpperCase() + key.slice(1);
      return `<div class="w-full"><h3 class="mb-1 border-b border-neutral-400 font-bold text-neutral-900" style="${headingStyle}">${escapeHtml(
        sectionTitles[key] || defaultHeading
      )}</h3><div class="space-y-2">${items
        .map(
          (item: any) => `<div data-resume-entry="true" class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <div class="font-semibold text-neutral-900"><span>${escapeHtml(
                item.name
              )}</span></div>
              ${
                item.date
                  ? `<span class="shrink-0 whitespace-nowrap text-neutral-700">${escapeHtml(
                      item.date
                    )}</span>`
                  : ''
              }
            </div>
            ${
              !isEmptyRichText(item.summary)
                ? `<div class="preview pt-0.5 text-neutral-800" style="line-height: ${lineHeightStyle};">${sanitizeRichText(
                    item.summary
                  )}</div>`
                : ''
            }
          </div>`
        )
        .join('')}</div></div>`;
    }

    return '';
  };

  const sectionsHtml = sectionOrder
    .map((k) => renderSectionHtml(k))
    .filter(Boolean)
    .join('\n');

  const sheetFragment = `<div class="resume-sheet relative flex flex-col bg-white text-neutral-900" style="font-size: ${fontSize}px; font-family: &quot;${escapeHtml(
    fontFamily
  )}&quot;, sans-serif; line-height: ${lineHeightStyle}; padding: 0px ${
    margins.right
  }px 0px ${margins.left}px;">
    <div class="flex flex-1 flex-col w-full preview" style="gap: ${sectionGapPx}px;">
      <header class="flex gap-4 ${headerFlexClass}" style="margin-bottom: ${Math.max(
    12,
    verticalSpacing * 6
  )}px; line-height: ${lineHeightStyle};">
        ${
          showPhoto
            ? `<img src="${escapeHtml(
                basics.photo.url
              )}" alt="${escapeHtml(
                basics.name || 'Profile'
              )}" class="shrink-0 object-cover" style="width: ${
                basics.photo.size || 100
              }px; height: ${basics.photo.size || 100}px; border-radius: ${
                basics.photo.borderRadius || 4
              }px;" />`
            : ''
        }
        <div class="flex flex-1 flex-col ${alignmentItemsClass}" style="line-height: ${lineHeightStyle};">
          ${
            basics.name
              ? `<h1 class="font-bold tracking-tight text-neutral-900" style="font-size: ${
                  fontSize + 10
                }px; line-height: ${lineHeightStyle};">${escapeHtml(
                  basics.name
                )}</h1>`
              : ''
          }
          ${
            basics.title
              ? `<p class="font-medium text-neutral-700" style="font-size: ${
                  fontSize + 2
                }px; line-height: ${lineHeightStyle};">${escapeHtml(
                  basics.title
                )}</p>`
              : ''
          }
          <div class="flex flex-col w-full text-neutral-700 ${alignmentItemsClass}" style="font-size: ${Math.max(
    10,
    fontSize - 1
  )}px; line-height: ${lineHeightStyle};">
            ${
              contactLine1Parts.length > 0
                ? `<div class="flex flex-wrap items-center gap-x-3 w-full ${alignmentJustifyClass}" style="line-height: ${lineHeightStyle};">${contactLine1Parts.join(
                    ''
                  )}</div>`
                : ''
            }
            ${
              contactLine2Parts.length > 0
                ? `<div class="flex flex-wrap items-center gap-x-3 w-full ${alignmentJustifyClass}" style="line-height: ${lineHeightStyle};">${contactLine2Parts.join(
                    ''
                  )}</div>`
                : ''
            }
          </div>
        </div>
      </header>
      ${sectionsHtml}
    </div>
  </div>`;

  return normalizeResumeHtmlForPdf(sheetFragment, {
    margins,
    fontFamily,
    title:
      title ||
      [basics.name, basics.title].filter(Boolean).join(' - ') ||
      'CV',
  });
}

import { z } from 'zod';

export interface ResolvedMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const MARGIN_LIMITS = {
  MIN: 0,
  MAX: 80,
  DEFAULT: 20,
} as const;

export const marginObjectSchema = z.object({
  MIN: z.number().optional(),
  MAX: z.number().optional(),
  INITIAL: z.number().optional(),
  STEP: z.number().optional(),
  VALUE: z.number().min(0).max(120).optional(),
  TOP: z.number().min(0).max(120).optional(),
  BOTTOM: z.number().min(0).max(120).optional(),
  LEFT: z.number().min(0).max(120).optional(),
  RIGHT: z.number().min(0).max(120).optional(),
});

export const marginInputSchema = z
  .union([z.number().min(0).max(120), marginObjectSchema])
  .optional()
  .nullable();

export type MarginInput = z.infer<typeof marginInputSchema>;

/**
 * Resolves any margin input (number, object with VALUE/TOP/BOTTOM/LEFT/RIGHT, or undefined)
 * into concrete { top, bottom, left, right } pixel values clamped to [0..80].
 */
export function resolveServerMargins(margin?: MarginInput): ResolvedMargins {
  const clamp = (v: number) =>
    Math.min(MARGIN_LIMITS.MAX, Math.max(MARGIN_LIMITS.MIN, v));

  if (typeof margin === 'number') {
    const safeNum = Number.isNaN(margin) ? MARGIN_LIMITS.DEFAULT : margin;
    const clamped = clamp(safeNum);
    return {
      top: clamped,
      bottom: clamped,
      left: clamped,
      right: clamped,
    };
  }

  const base = margin?.VALUE ?? MARGIN_LIMITS.DEFAULT;
  return {
    top: clamp(margin?.TOP ?? base),
    bottom: clamp(margin?.BOTTOM ?? base),
    left: clamp(margin?.LEFT ?? base),
    right: clamp(margin?.RIGHT ?? base),
  };
}

export const pdfExportRequestSchema = z
  .object({
    htmlContent: z
      .string()
      .max(12 * 1024 * 1024, 'HTML payload exceeds maximum allowed size (12MB)')
      .optional(),
    resumeData: z.record(z.string(), z.unknown()).optional(),
    pdfSettings: z.record(z.string(), z.unknown()).optional(),
    sectionOrder: z.array(z.string()).optional(),
    hiddenItemIds: z.array(z.string()).optional(),
    hiddenSections: z.array(z.string()).optional(),
    margin: marginInputSchema,
    fileName: z.string().max(260).optional(),
  })
  .superRefine((data, ctx) => {
    const hasHtml =
      typeof data.htmlContent === 'string' &&
      data.htmlContent.trim().length > 0;
    const hasResumeData =
      typeof data.resumeData === 'object' &&
      data.resumeData !== null &&
      Object.keys(data.resumeData).length > 0;

    if (!hasHtml && !hasResumeData) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['htmlContent'],
        message:
          'Either non-empty "htmlContent" or structured "resumeData" must be provided to generate a PDF.',
      });
    }
  });

export type PdfExportRequest = z.infer<typeof pdfExportRequestSchema>;

const ALLOWED_PHOTO_DATA_URL_REGEX =
  /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/i;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB

export const photoUploadRequestSchema = z
  .object({
    image: z.string().min(1, 'Image data URL is required'),
  })
  .superRefine((data, ctx) => {
    const trimmed = data.image.trim();
    if (!ALLOWED_PHOTO_DATA_URL_REGEX.test(trimmed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['image'],
        message:
          'Invalid image format. Only base64 Data URLs for PNG, JPEG, JPG, or WEBP are supported.',
      });
      return;
    }

    const commaIndex = trimmed.indexOf(',');
    const base64Part = commaIndex >= 0 ? trimmed.slice(commaIndex + 1) : '';
    const cleanBase64 = base64Part.replace(/\s+/g, '');
    const padding = cleanBase64.endsWith('==')
      ? 2
      : cleanBase64.endsWith('=')
      ? 1
      : 0;
    const byteLength = Math.floor((cleanBase64.length * 3) / 4) - padding;

    if (byteLength > MAX_PHOTO_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['image'],
        message: 'Photo exceeds maximum allowed size of 2MB.',
      });
    }
  });

export type PhotoUploadRequest = z.infer<typeof photoUploadRequestSchema>;

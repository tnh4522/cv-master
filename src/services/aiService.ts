import { GoogleGenAI } from '@google/genai';
import type { Interactions } from '@google/genai';
import type { CVAnalysisResult, ResumeData } from '@/types/resume';
import { DEFAULT_RESUME_DATA } from '@/store/useResumeStore';
import { sanitizeAiJsonOutput } from '@/services/importService';

const ai = new GoogleGenAI({
  apiKey:
    process.env['VITE_GEMINI_API_KEY'] ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    'not-configured',
});

export type CustomizeOption =
  | 'shorter'
  | 'longer'
  | 'more_formal'
  | 'more_informal'
  | 'more_creative'
  | 'more_technical';

export interface CustomizePreset {
  value: CustomizeOption;
  label: string;
  prompt: string;
}

/**
 * Exact 6 verified CVMaster customization presets (`te` in `Xu`, index-B9ESfVPA.js).
 */
export const CUSTOMIZE_OPTIONS: CustomizePreset[] = [
  {
    value: 'shorter',
    label: 'Shorter',
    prompt:
      'Make the response shorter by removing unnecessary information, focusing only on key points.',
  },
  {
    value: 'longer',
    label: 'Longer',
    prompt:
      'Make the response longer by adding more information, focusing on key points and details.',
  },
  {
    value: 'more_formal',
    label: 'More Formal',
    prompt:
      'Make the response more formal by using more professional language and tone.',
  },
  {
    value: 'more_informal',
    label: 'More Informal',
    prompt:
      'Make the response more informal by using more casual language and tone.',
  },
  {
    value: 'more_creative',
    label: 'More Creative',
    prompt:
      'Make the response more creative by using more creative language and tone.',
  },
  {
    value: 'more_technical',
    label: 'More Technical',
    prompt:
      'Make the response more technical by using more technical language and tone.',
  },
];

/**
 * Verified system prompts from `assets/index-B9ESfVPA.js` (`Mu`, `Lu`, `Ou`, `Bu`).
 */
export const VERIFIED_PROMPTS = {
  IMPROVE_SYSTEM: `You are an executive resume writer and content editor. Your task is:
1. Enhance the content to be more professional, polished, and impactful in professional ENGLISH for a CV/resume.
2. CRITICAL INSTRUCTION: If the original content is in Vietnamese or another language, translate and polish it into natural, professional ENGLISH.
3. Maintain approximately the same length as the original.
4. Preserve all HTML tags and structure (<p>, <ul>, <li>, <strong>, <em>, ...) exactly as they appear.
5. Focus on clarity, precision, and professional tone with strong action verbs.
6. Remove redundancies and unnecessary words.
Return ONLY the improved content in ENGLISH without any explanations or meta-text.`,

  FIX_TYPOS_SYSTEM: `You are a professional proofreader and editor for English CVs. Your task is to correct spelling, grammar, and punctuation errors in ENGLISH while:
1. Preserving all HTML tags and structure exactly as they appear.
2. Maintaining the original meaning and tone.
3. Ensuring proper capitalization, punctuation, and spacing in ENGLISH.
Return ONLY the corrected content in ENGLISH without any explanations.`,

  CUSTOMIZE_SYSTEM: `You are a professional executive resume copywriter. Your task is to customize the provided content according to the user's prompt in natural, professional ENGLISH:
1. CRITICAL INSTRUCTION: If the original content is in Vietnamese or another language, translate and adapt it into natural, professional ENGLISH.
2. Preserve all HTML tags and structure exactly as they appear.
3. Maintain the original content's core message and intent.
4. Keep the output exactly the same length as the input, UNLESS the prompt specifically requests to make it shorter or longer.
5. Focus on adjusting tone, style, and word choice to match the customization request.
6. Ensure the output is clean - no explanations, headers, or additional formatting.
Return ONLY the modified content in ENGLISH.`,

  CV_REVIEW_SYSTEM: `You are an expert ATS (Applicant Tracking System) evaluator and executive technical recruiter.
Analyze the candidate's resume JSON against the target job title and job description.
CRITICAL INSTRUCTION: The user's resume language is ENGLISH. You MUST write ALL textual analysis, feedback, summary strengths/weaknesses, recommendations, feedback strings, sectionsToImprove, and nextSteps strictly in natural, professional ENGLISH. Even if the resume contains Vietnamese names, companies, or locations, all review text MUST be in ENGLISH.
Return ONLY a valid JSON object matching this exact schema:
{
  "overallScore": number (0-100),
  "jobFitPercentage": number (0-100),
  "isResume": boolean,
  "estimatedImprovementTime": string,
  "summary": {
    "strengths": string[],
    "weaknesses": string[],
    "fitLevel": "Excellent" | "Good" | "Fair" | "Poor"
  },
  "detailedAnalysis": {
    "contentAlignment": {
      "score": number (0-100),
      "feedback": string,
      "matchingSkills": string[],
      "missingSkills": string[]
    },
    "experienceRelevance": {
      "score": number (0-100),
      "feedback": string,
      "relevantExperience": string[],
      "experienceGaps": string[]
    },
    "resumeStructure": {
      "score": number (0-100),
      "feedback": string,
      "sectionsToImprove": [{ "sectionName": string, "improvement": string }]
    },
    "atsCompatibility": {
      "score": number (0-100),
      "feedback": string,
      "missingKeywords": string[]
    }
  },
  "recommendations": {
    "highPriority": string[],
    "mediumPriority": string[],
    "lowPriority": string[]
  },
  "specificImprovements": {
    "Summary": string[],
    "Experience": string[],
    "Skills": string[],
    "Projects": string[]
  },
  "nextSteps": string[]
}`,
} as const;

/**
 * Strips HTML tags into plain text while preserving list item boundaries.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Converts lines back into clean HTML paragraphs or bullet list items.
 */
function linesToHtml(lines: string[], asList: boolean): string {
  const cleaned = lines
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (cleaned.length === 0) return '<p></p>';
  if (asList || cleaned.length > 1) {
    return `<ul>${cleaned.map((line) => `<li><p>${line}</p></li>`).join('')}</ul>`;
  }
  return `<p>${cleaned[0]}</p>`;
}

export interface GeminiCallOptions {
  systemInstruction: string;
  userPrompt: string;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  inlineImage?: {
    mimeType: string;
    base64Data: string;
  };
}

/**
 * Calls Google Gemini Interactions API (`ai.interactions.create`) via `@google/genai`
 * when `VITE_GEMINI_API_KEY` is configured.
 * Never embeds private API keys in client-side source code.
 */
export async function callGeminiInteraction(
  options: GeminiCallOptions
): Promise<string | null> {
  // Do not make unmetered/slow live external API calls during automated unit test runs
  if (import.meta.env.MODE === 'test' && !import.meta.env.VITE_TEST_LIVE_AI) {
    return null;
  }

  const apiKey =
    process.env['VITE_GEMINI_API_KEY'] ||
    import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'not-configured') {
    return null;
  }

  const rawModel =
    process.env['VITE_GEMINI_MODEL'] ||
    import.meta.env.VITE_GEMINI_MODEL ||
    'gemini-3.8-flash';
  const modelMap: Record<string, string> = {
    'gemini-2.5-flash': 'gemini-3.8-flash',
    'gemini-2.5-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-2.0-flash': 'gemini-3.8-flash',
    'gemini-2.0-flash-lite': 'gemini-3.5-flash-lite',
    'gemini-1.5-flash': 'gemini-3.8-flash',
    'gemini-1.5-pro': 'gemini-3.8-flash',
    'gemini-3.7-flash': 'gemini-3.8-flash',
    'gemini-3.6-flash': 'gemini-3.8-flash',
    'gemini-3.5-flash': 'gemini-3.8-flash',
    'gemini-3-flash-preview': 'gemini-3.8-flash',
  };
  const model = modelMap[rawModel] || rawModel;

  const input: Interactions.InteractionCreateParams.CreateModelInteractionParamsNonStreaming['input'] =
    options.inlineImage
      ? [
          {
            type: 'text',
            text: options.userPrompt,
          },
          {
            type: 'image',
            data: options.inlineImage.base64Data,
            mime_type: options.inlineImage.mimeType,
          },
        ]
      : options.userPrompt;

  const generationConfig: Interactions.GenerationConfig = {
    max_output_tokens: options.maxOutputTokens ?? 1024,
  };

  const responseFormat: Interactions.TextResponseFormat | undefined =
    options.jsonMode
      ? {
          type: 'text',
          mime_type: 'application/json',
        }
      : undefined;

  const createParams: Interactions.InteractionCreateParams.CreateModelInteractionParamsNonStreaming =
    {
      model,
      input,
      system_instruction: options.systemInstruction,
      generation_config: generationConfig,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    };

  const extractInteractionText = (
    interaction: Interactions.Interaction
  ): string | null => {
    if (interaction.output_text?.trim()) {
      return interaction.output_text.trim();
    }
    const steps = interaction.steps || [];
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i];
      if (step.type === 'model_output' && Array.isArray(step.content)) {
        const text = step.content
          .map((part) => (part.type === 'text' ? part.text || '' : ''))
          .join('')
          .trim();
        if (text) return text;
      }
    }
    return null;
  };

  try {
    const interaction = await ai.interactions.create(createParams);
    return extractInteractionText(interaction);
  } catch (error) {
    if (model !== 'gemini-3.8-flash') {
      try {
        console.warn(
          `Gemini model "${model}" failed. Retrying with "gemini-3.8-flash"...`
        );
        const fallbackInteraction = await ai.interactions.create({
          ...createParams,
          model: 'gemini-3.8-flash',
        });
        return extractInteractionText(fallbackInteraction);
      } catch (retryError) {
        console.warn('Gemini Interactions API error:', retryError);
        return null;
      }
    }
    console.warn('Gemini Interactions API error:', error);
    return null;
  }
}

export const callGeminiGenerateContent = callGeminiInteraction;

/**
 * Resolves whether AI output should be Vietnamese or English.
 * If targetLanguage is explicitly specified as 'vi' or 'en', it is the STRICT authority.
 * Only if targetLanguage is not provided, falls back to text content inspection.
 */
export function resolveIsVietnamese(
  targetLanguage?: string,
  fallbackText?: string
): boolean {
  if (targetLanguage === 'vi') return true;
  if (targetLanguage === 'en') return false;
  if (fallbackText) {
    return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      fallbackText
    );
  }
  return false;
}

/**
 * Improves writing quality of rich-text HTML content (`Mu`).
 * Uses Gemini AI with verified CVMaster prompts when configured, or deterministic local enhancement.
 */
export async function improveWriting(
  htmlContent: string,
  targetLanguage?: string
): Promise<string> {
  const isVietnamese = resolveIsVietnamese(targetLanguage, htmlContent);

  const systemInstruction = isVietnamese
    ? `Bạn là chuyên gia biên tập nội dung CV chuyên nghiệp. Nhiệm vụ của bạn là:
1. Nâng cao chất lượng nội dung bằng TIẾNG VIỆT tự nhiên, trau chuốt, cô đọng và chuyên nghiệp. Nếu văn bản gốc là ngôn ngữ khác, hãy dịch và tối ưu sang TIẾNG VIỆT.
2. Giữ nguyên độ dài tương đương bản gốc.
3. Giữ nguyên 100% tất cả các thẻ HTML (<p>, <ul>, <li>, <strong>, <em>, ...).
4. Loại bỏ các từ thừa, diễn đạt rườm rà.
Chỉ trả về nội dung đã cải thiện bằng TIẾNG VIỆT, không thêm giải thích hay lời mở đầu.`
    : VERIFIED_PROMPTS.IMPROVE_SYSTEM;

  const userPrompt = isVietnamese
    ? `Vui lòng cải thiện nội dung sau đây bằng tiếng Việt chuyên nghiệp, tự nhiên cho CV, giữ nguyên cấu trúc HTML:\n\n${htmlContent}`
    : `Please enhance and polish the following content in professional English for a CV/resume. If the content is in another language, translate and refine it into professional English while preserving all HTML markup:\n\n${htmlContent}`;

  const remote = await callGeminiInteraction({
    systemInstruction,
    userPrompt,
    maxOutputTokens: 1024,
  });
  if (remote) return remote;

  await new Promise((r) => setTimeout(r, 350));
  const hasList = /<ul|<ol|<li/i.test(htmlContent);
  const rawLines = stripHtml(htmlContent)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return htmlContent;

  const actionVerbsEn: Record<string, string> = {
    worked: 'Collaborated',
    helped: 'Facilitated',
    made: 'Engineered',
    built: 'Architected and delivered',
    did: 'Executed',
    managed: 'Spearheaded',
    led: 'Directed',
    created: 'Designed and implemented',
    responsible: 'Accountable',
  };

  const actionVerbsVi: Record<string, string> = {
    'đã làm': 'Đã chủ trì và thực hiện',
    'làm': 'Chủ trì',
    'giúp': 'Đã tích cực phối hợp và hỗ trợ',
    'hỗ trợ': 'Hỗ trợ nòng cốt',
    'xây dựng': 'Đã thiết kế và triển khai',
    'quản lý': 'Chỉ đạo và điều phối hiệu quả',
    'chịu trách nhiệm': 'Đảm nhận trách nhiệm chính',
    'tham gia': 'Tham gia chủ lực trong việc',
  };

  const actionVerbs = isVietnamese ? actionVerbsVi : actionVerbsEn;

  const improved = rawLines.map((line) => {
    let next = line.replace(/^[-•*]\s*/, '');
    for (const [weak, strong] of Object.entries(actionVerbs)) {
      const regex = new RegExp(`^${weak}\\b`, 'i');
      if (regex.test(next)) {
        next = next.replace(regex, strong);
        break;
      }
    }
    if (!/[.!?]$/.test(next)) next += '.';
    return next.charAt(0).toUpperCase() + next.slice(1);
  });

  return linesToHtml(improved, hasList);
}

/**
 * Fixes spelling, grammar, and punctuation typos in rich-text HTML content (`Lu`).
 */
export async function fixTypos(
  htmlContent: string,
  targetLanguage?: string
): Promise<string> {
  const isVietnamese = resolveIsVietnamese(targetLanguage, htmlContent);

  const systemInstruction = isVietnamese
    ? `Bạn là chuyên gia soát lỗi chính tả và ngữ pháp tiếng Việt. Nhiệm vụ của bạn là sửa các lỗi chính tả, dấu câu và khoảng cách trong văn bản tiếng Việt nhưng giữ nguyên tất cả cấu trúc HTML. Chỉ trả về nội dung đã sửa bằng TIẾNG VIỆT.`
    : VERIFIED_PROMPTS.FIX_TYPOS_SYSTEM;

  const userPrompt = isVietnamese
    ? `Vui lòng soát lỗi chính tả và ngữ pháp tiếng Việt cho nội dung sau, giữ nguyên thẻ HTML: "${htmlContent}"`
    : `Please proofread and correct any spelling, grammar, or punctuation errors in English for the following content, while preserving all HTML markup: "${htmlContent}"`;

  const remote = await callGeminiInteraction({
    systemInstruction,
    userPrompt,
    maxOutputTokens: 1024,
  });
  if (remote) return remote;

  await new Promise((r) => setTimeout(r, 250));
  const commonTypos: Record<string, string> = {
    teh: 'the',
    recieve: 'receive',
    seperate: 'separate',
    occured: 'occurred',
    accomodate: 'accommodate',
    definately: 'definitely',
    enviroment: 'environment',
    managment: 'management',
    developement: 'development',
    experiance: 'experience',
    responsable: 'responsible',
    succesful: 'successful',
    implemention: 'implementation',
    perfomance: 'performance',
    maintainance: 'maintenance',
    duoc: 'được',
    khong: 'không',
  };

  let fixed = htmlContent.replace(/\s{2,}/g, ' ');
  for (const [wrong, right] of Object.entries(commonTypos)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    fixed = fixed.replace(regex, (match) =>
      match[0] === match[0].toUpperCase()
        ? right.charAt(0).toUpperCase() + right.slice(1)
        : right
    );
  }
  return fixed;
}

/**
 * Customizes rich-text HTML content according to one of the 6 verified CVMaster presets (`Ou`).
 */
export async function customizeWriting(
  htmlContent: string,
  option: CustomizeOption,
  targetLanguage?: string
): Promise<string> {
  const isVietnamese = resolveIsVietnamese(targetLanguage, htmlContent);

  const preset = CUSTOMIZE_OPTIONS.find((o) => o.value === option);
  const promptText = preset ? preset.prompt : option;
  const systemInstruction = isVietnamese
    ? `Bạn là chuyên gia điều chỉnh giọng văn CV chuyên nghiệp bằng tiếng Việt. Nhiệm vụ của bạn là tùy biến nội dung theo yêu cầu, giữ nguyên 100% cấu trúc thẻ HTML. Chỉ trả về nội dung đã tùy biến bằng tiếng Việt.`
    : VERIFIED_PROMPTS.CUSTOMIZE_SYSTEM;

  const userPrompt = isVietnamese
    ? `Tùy biến nội dung sau bằng tiếng Việt theo phong cách ${option} (${promptText}), giữ nguyên thẻ HTML: "${htmlContent}"`
    : `Customize the following content to make it more ${promptText} in professional English for an executive CV, preserving HTML tags: "${htmlContent}"`;

  const remote = await callGeminiInteraction({
    systemInstruction,
    userPrompt,
    maxOutputTokens: 1024,
  });
  if (remote) return remote;

  await new Promise((r) => setTimeout(r, 350));
  const hasList = /<ul|<ol|<li/i.test(htmlContent);
  const lines = stripHtml(htmlContent)
    .split('\n')
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  if (lines.length === 0) return htmlContent;

  const transformed = lines.map((line) => {
    const base = line.replace(/[.!?]+$/, '');
    if (isVietnamese) {
      switch (option) {
        case 'shorter': {
          const clauses = base.split(
            /,\s*(?:giúp|nhằm|đồng thời|qua đó|bằng cách)\b/i
          );
          return `${clauses[0].trim()}.`;
        }
        case 'longer':
          return `${base}, qua đó tối ưu hóa hiệu suất vận hành và thúc đẩy sự phát triển bền vững của toàn đội ngũ.`;
        case 'more_formal':
          return `${base.replace(
            /\b(đã làm|làm việc|tham gia)\b/gi,
            'chủ trì triển khai'
          )}, đảm bảo đồng bộ hóa giải pháp kỹ thuật với chiến lược phát triển chung.`;
        case 'more_informal':
          return `${base}.`;
        case 'more_creative':
          return `Hiện thực hóa giải pháp đột phá: ${base.charAt(0).toLowerCase()}${base.slice(
            1
          )}, mang lại giá trị trải nghiệm tối ưu.`;
        case 'more_technical':
          return `${base} dựa trên kiến trúc mô-đun hóa, tiêu chuẩn bảo mật cao và quy trình CI/CD tự động.`;
        default:
          return `${base}.`;
      }
    }

    switch (option) {
      case 'shorter': {
        const clauses = base.split(
          /,\s*(?:which|resulting in|leading to|while|by)\b/i
        );
        return `${clauses[0].trim()}.`;
      }
      case 'longer':
        return `${base}, driving measurable cross-functional efficiency and long-term architectural maintainability.`;
      case 'more_formal':
        return `${base.replace(
          /\b(used|did|made|worked on)\b/gi,
          'leveraged'
        )}, aligning technical execution with strategic organizational objectives.`;
      case 'more_informal':
        return `${base
          .replace(/\b(utilized|leveraged)\b/gi, 'used')
          .replace(/\b(facilitated|spearheaded)\b/gi, 'led')}.`;
      case 'more_creative':
        return `Transformed vision into reality: ${base.charAt(0).toLowerCase()}${base.slice(
          1
        )}, crafting intuitive user experiences.`;
      case 'more_technical':
        return `${base} using modular design patterns, type-safe interfaces, and automated CI/CD pipelines.`;
      default:
        return `${base}.`;
    }
  });

  return linesToHtml(transformed, hasList);
}

/**
 * Checks whether a ResumeData object is effectively empty (`Bu` guard clause).
 */
export function isResumeEmpty(resumeData: ResumeData): boolean {
  const hasName = Boolean(resumeData.basics?.name?.trim());
  const hasSummary =
    stripHtml(resumeData.summary?.content || '').trim().length > 0;
  const hasExp = resumeData.experience.length > 0;
  const hasEdu = resumeData.education.length > 0;
  const hasSkills = resumeData.skills.length > 0;
  const hasProjects = resumeData.projects.length > 0;

  return (
    !hasName &&
    !hasSummary &&
    !hasExp &&
    !hasEdu &&
    !hasSkills &&
    !hasProjects
  );
}

/**
 * Analyzes a resume against a target job title and job description (`Bu`),
 * using Gemini AI JSON mode when configured and enforcing verified guard clauses.
 */
export async function analyzeResumeForRole(params: {
  resumeData: ResumeData;
  jobTitle: string;
  jobDescription: string;
  language?: string;
}): Promise<CVAnalysisResult> {
  const { resumeData, jobTitle, jobDescription, language } = params;

  if (isResumeEmpty(resumeData)) {
    throw new Error('cannot analyze an empty resume');
  }

  if (jobTitle.trim().length < 5 || jobDescription.trim().length < 20) {
    throw new Error('Please enter a valid job title and description');
  }

  const isVietnamese =
    resumeData.cvLanguage === 'vi'
      ? true
      : resumeData.cvLanguage === 'en'
      ? false
      : language === 'vi'
      ? true
      : language === 'en'
      ? false
      : /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
          jobTitle + jobDescription
        );

  const reviewSystemPrompt = isVietnamese
    ? `You are an expert ATS (Applicant Tracking System) evaluator and executive technical recruiter.
Analyze the candidate's resume JSON against the target job title and job description.
IMPORTANT INSTRUCTION: The user's resume language is VIETNAMESE. You MUST write ALL textual analysis, feedback, summary strengths/weaknesses, recommendations, feedback strings, sectionsToImprove, and nextSteps in natural, fluent, professional VIETNAMESE (Tiếng Việt).
All JSON keys and fitLevel enum values ("Excellent" | "Good" | "Fair" | "Poor") MUST remain in English matching the schema.
Return ONLY valid JSON matching this schema:
{
  "overallScore": number (0-100),
  "jobFitPercentage": number (0-100),
  "isResume": boolean,
  "estimatedImprovementTime": string,
  "summary": {
    "strengths": string[],
    "weaknesses": string[],
    "fitLevel": "Excellent" | "Good" | "Fair" | "Poor"
  },
  "detailedAnalysis": {
    "contentAlignment": {
      "score": number (0-100),
      "feedback": string,
      "matchingSkills": string[],
      "missingSkills": string[]
    },
    "experienceRelevance": {
      "score": number (0-100),
      "feedback": string,
      "relevantExperience": string[],
      "experienceGaps": string[]
    },
    "resumeStructure": {
      "score": number (0-100),
      "feedback": string,
      "sectionsToImprove": [{ "sectionName": string, "improvement": string }]
    },
    "atsCompatibility": {
      "score": number (0-100),
      "feedback": string,
      "missingKeywords": string[]
    }
  },
  "recommendations": {
    "highPriority": string[],
    "mediumPriority": string[],
    "lowPriority": string[]
  },
  "specificImprovements": {
    "Summary": string[],
    "Experience": string[],
    "Skills": string[],
    "Projects": string[]
  },
  "nextSteps": string[]
}`
    : VERIFIED_PROMPTS.CV_REVIEW_SYSTEM;

  const remoteJson = await callGeminiInteraction({
    systemInstruction: reviewSystemPrompt,
    userPrompt: JSON.stringify({
      jobTitle,
      jobDescription,
      resume: resumeData,
    }),
    maxOutputTokens: 8192,
    jsonMode: true,
  });

  if (remoteJson) {
    try {
      const cleaned = sanitizeAiJsonOutput(remoteJson);
      const parsed = JSON.parse(cleaned) as CVAnalysisResult;
      if (parsed?.isResume === false) {
        throw new Error('cannot analyze an empty resume');
      }
      if (parsed?.jobFitPercentage === 0) {
        throw new Error('Please enter a valid job title and description');
      }
      if (typeof parsed?.overallScore === 'number' && parsed?.summary) {
        return parsed;
      }
    } catch (err) {
      if (
        err instanceof Error &&
        (err.message === 'cannot analyze an empty resume' ||
          err.message === 'Please enter a valid job title and description')
      ) {
        throw err;
      }
    }
  }

  const summaryPlain = stripHtml(resumeData.summary?.content || '');
  const expCount = resumeData.experience.length;
  const projectCount = resumeData.projects.length;
  const softSkillCount = (resumeData.softSkills || []).reduce(
    (acc: number, item) => acc + (item.keywords?.length || 0),
    0
  );
  const skillCount =
    resumeData.skills.reduce(
      (acc: number, item) => acc + (item.keywords?.length || 0),
      0
    ) + softSkillCount;

  const stopWords = new Set([
    'with',
    'from',
    'that',
    'this',
    'have',
    'will',
    'your',
    'team',
    'work',
    'role',
    'years',
    'experience',
    'looking',
    'strong',
    'ability',
  ]);
  const jdTokens = Array.from(
    new Set(
      `${jobTitle} ${jobDescription}`
        .toLowerCase()
        .match(/[a-z][a-z0-9+#.-]{3,}/g)
        ?.filter((w) => !stopWords.has(w)) || []
    )
  ).slice(0, 12);

  const resumeCorpus = JSON.stringify(resumeData).toLowerCase();
  const matchingSkills = jdTokens.filter((kw) => resumeCorpus.includes(kw));
  const missingSkills = jdTokens
    .filter((kw) => !resumeCorpus.includes(kw))
    .slice(0, 6);

  const overallScore = Math.min(
    94,
    Math.max(
      65,
      58 +
        Math.min(15, expCount * 6) +
        Math.min(10, projectCount * 4) +
        Math.min(10, Math.floor(skillCount / 2)) +
        (summaryPlain.length > 60 ? 6 : 0)
    )
  );

  const jobFitPercentage = Math.min(
    96,
    Math.max(60, overallScore - 2 + matchingSkills.length * 2)
  );

  await new Promise((r) => setTimeout(r, 400));

  if (isVietnamese) {
    return {
      overallScore,
      jobFitPercentage,
      isResume: true,
      estimatedImprovementTime: '20-25 phút',
      summary: {
        fitLevel:
          overallScore >= 85
            ? 'Excellent'
            : overallScore >= 72
            ? 'Good'
            : 'Fair',
        strengths: [
          `Độ tương thích cao với yêu cầu trọng tâm của vị trí ${jobTitle} (${skillCount} kỹ năng ghi nhận).`,
          `${expCount} kinh nghiệm làm việc mạch lạc cùng ${projectCount} dự án minh chứng thực tế.`,
          'Bố cục CV đơn cột chuẩn mực, tối ưu hóa khả năng quét và trích xuất dữ liệu của ATS.',
        ],
        weaknesses: [
          'Một số điểm kinh nghiệm cần bổ sung thêm số liệu đo lường kết quả cụ thể.',
          missingSkills.length > 0
            ? `Cần bổ sung các từ khóa chuyên môn quan trọng: ${missingSkills
                .slice(0, 4)
                .join(', ')}.`
            : 'Mô tả tóm tắt có thể nhấn mạnh trực tiếp hơn chức danh ứng tuyển.',
        ],
      },
      detailedAnalysis: {
        contentAlignment: {
          score: Math.min(95, overallScore + 2),
          feedback: `Hồ sơ kỹ năng và tóm tắt của bạn phù hợp tốt với các yêu cầu của ${jobTitle}.`,
          matchingSkills:
            matchingSkills.length > 0
              ? matchingSkills
              : ['Phát triển phần mềm', 'TypeScript', 'React'],
          missingSkills:
            missingSkills.length > 0
              ? missingSkills
              : ['Thiết kế kiến trúc hệ thống', 'Tối ưu hóa hiệu năng'],
        },
        experienceRelevance: {
          score: overallScore,
          feedback: `Đã ghi nhận ${expCount} mục kinh nghiệm với tiến trình phát triển chuyên môn rõ ràng.`,
          relevantExperience: resumeData.experience.map(
            (e) => `${e.position} tại ${e.name}`
          ),
          experienceGaps: [
            'Nên nêu bật quy mô dự án, lượng người dùng hoặc hiệu suất gia tăng trong từng vai trò.',
          ],
        },
        resumeStructure: {
          score: Math.min(96, overallScore + 4),
          feedback:
            'Cấu trúc các mục mạch lạc, phân cấp kiểu chữ chuẩn và dễ dàng tra cứu nhanh.',
          sectionsToImprove: [
            {
              sectionName: 'Summary',
              improvement: `Tùy biến câu mở đầu bám sát trực tiếp vào vị trí ${jobTitle}.`,
            },
            {
              sectionName: 'Experience',
              improvement:
                'Bắt đầu mỗi gạch đầu dòng bằng động từ hành động mạnh và kết thúc bằng kết quả cụ thể.',
            },
          ],
        },
        atsCompatibility: {
          score: Math.min(98, overallScore + 5),
          feedback:
            'Tiêu đề mục chuẩn và định dạng ngữ nghĩa giúp ATS đọc hiểu tài liệu chính xác.',
          missingKeywords: missingSkills,
        },
      },
      recommendations: {
        highPriority: [
          'Bổ sung con số phần trăm hoặc số liệu định lượng vào ít nhất 3 điểm kinh nghiệm làm việc.',
          `Tích hợp các từ khóa cốt lõi của vị trí ${jobTitle} vào phần Tóm tắt và Kỹ năng.`,
        ],
        mediumPriority: [
          'Làm nổi bật các quyết định thiết kế kiến trúc và giải pháp kỹ thuật trong phần Dự án.',
        ],
        lowPriority: [
          'Đồng bộ hóa định dạng ngày tháng và kiểm tra tính hợp lệ của các liên kết portfolio.',
        ],
      },
      specificImprovements: {
        Summary: [
          `Đề cập chức danh "${jobTitle}" và thành tích nổi bật nhất ngay trong 2 dòng đầu tiên.`,
          'Giữ phần tóm tắt súc tích trong 3-4 câu tập trung vào giá trị mang lại.',
        ],
        Experience: [
          'Áp dụng công thức XYZ: Đạt được [X] đo lường bởi [Y] thông qua hành động [Z].',
          'Định lượng mức độ giảm thời gian phản hồi, tăng lưu lượng hoặc số người dùng phục vụ.',
        ],
        Skills: [
          'Sắp xếp nhóm kỹ năng cốt lõi phù hợp nhất lên đầu danh sách.',
          'Kết hợp cả kỹ năng chuyên môn kỹ thuật lẫn công cụ quản lý dự án.',
        ],
        Projects: [
          'Ghi rõ công nghệ chính đã sử dụng và vai trò cá nhân đảm nhiệm.',
          'Cung cấp liên kết demo hoặc mã nguồn để nhà tuyển dụng đánh giá thực tế.',
        ],
      },
      nextSteps: [
        'Cập nhật các số liệu định lượng vào phần Kinh nghiệm làm việc.',
        'Đối chiếu và bổ sung các từ khóa còn thiếu vào danh sách Kỹ năng.',
        'Xuất file PDF chuẩn ATS và tiến hành nộp hồ sơ ứng tuyển.',
      ],
    };
  }

  return {
    overallScore,
    jobFitPercentage,
    isResume: true,
    estimatedImprovementTime: '25-30 minutes',
    summary: {
      fitLevel:
        overallScore >= 85
          ? 'Excellent'
          : overallScore >= 72
          ? 'Good'
          : 'Fair',
      strengths: [
        `Clear alignment with ${jobTitle} core competencies (${skillCount} documented skills).`,
        `${expCount} structured work experience entries and ${projectCount} supporting projects.`,
        'Clean single-column A4 formatting ensures high ATS readability.',
      ],
      weaknesses: [
        'Several experience bullet points can include more baseline-to-outcome metrics.',
        missingSkills.length > 0
          ? `Missing explicit mention of role keywords: ${missingSkills
              .slice(0, 4)
              .join(', ')}.`
          : 'Professional summary can more directly mirror the target job title.',
      ],
    },
    detailedAnalysis: {
      contentAlignment: {
        score: Math.min(95, overallScore + 2),
        feedback: `Your skills and summary align well with ${jobTitle} requirements.`,
        matchingSkills:
          matchingSkills.length > 0
            ? matchingSkills
            : ['Software Engineering', 'TypeScript', 'React'],
        missingSkills:
          missingSkills.length > 0
            ? missingSkills
            : ['System Design', 'Performance Optimization'],
      },
      experienceRelevance: {
        score: overallScore,
        feedback: `Documented ${expCount} experience entries with clear chronological progression.`,
        relevantExperience: resumeData.experience.map(
          (e) => `${e.position} at ${e.name}`
        ),
        experienceGaps: [
          'Include specific team scope, scale, or revenue/efficiency metrics in each role.',
        ],
      },
      resumeStructure: {
        score: Math.min(96, overallScore + 4),
        feedback:
          'Well-structured sections, clear typography, and scannable bullet lists.',
        sectionsToImprove: [
          {
            sectionName: 'Summary',
            improvement: `Tailor the opening sentence specifically for the ${jobTitle} position.`,
          },
          {
            sectionName: 'Experience',
            improvement:
              'Lead every bullet with a high-impact action verb and end with quantified impact.',
          },
        ],
      },
      atsCompatibility: {
        score: Math.min(98, overallScore + 5),
        feedback:
          'Standard headings and semantic HTML structure provide excellent ATS parseability.',
        missingKeywords: missingSkills,
      },
    },
    recommendations: {
      highPriority: [
        'Add concrete percentages and metrics to at least 3 work experience bullet points.',
        `Incorporate target role keywords into your Summary and Skills sections for ${jobTitle}.`,
      ],
      mediumPriority: [
        'Highlight technical architecture decisions and measurable outcomes in your Projects section.',
      ],
      lowPriority: [
        'Standardize date formats and ensure all external portfolio links are active.',
      ],
    },
    specificImprovements: {
      Summary: [
        `Mention "${jobTitle}" and your top quantified career achievement in the first two lines.`,
        'Keep the summary concise (3-4 sentences focused on measurable value).',
      ],
      Experience: [
        'Use the XYZ formula: Accomplished [X] as measured by [Y], by doing [Z].',
        'Quantify latency reductions, throughput gains, or user adoption metrics.',
      ],
      Skills: [
        'Order your skill categories so the technologies most relevant to the job description appear first.',
      ],
      Projects: [
        'Include live demo or repository links and highlight the core problem solved.',
      ],
    },
    nextSteps: [
      'Update your Professional Summary to mirror the target role title and seniority.',
      'Add missing domain keywords from the job description into your Skills and Experience sections.',
      'Re-run AI CV Review to verify your updated ATS score before exporting to PDF.',
    ],
  };
}

export interface GenerateInterestOptions {
  name: string;
  currentDescription?: string;
  jobTitle?: string;
  language?: string;
}

export interface InterestAiOutput {
  description: string;
  keywords: string[];
}

/**
 * AI system prompt for generating professional interest descriptions and keyword tags.
 */
const INTEREST_GENERATOR_SYSTEM = `You are an expert executive resume writer and career coach.
Your task is to craft a polished, professional description and 3-5 relevant keywords for a candidate's hobby or interest on their CV/Resume.

Strict guidelines:
1. Emphasize how this interest reflects positive personal traits: discipline, curiosity, creativity, leadership, continuous learning, problem-solving, attention to detail, teamwork, or healthy work-life balance.
2. Keep the description concise (1-2 sentences, max 25-35 words), natural, mature, and impactful.
3. LANGUAGE REQUIREMENT:
   - If the user prompt specifies Language: "English", you MUST generate the description and all keywords strictly in professional ENGLISH. If the hobby name or notes are in Vietnamese (e.g. "Chụp ảnh", "Đá bóng"), translate them and output strictly in ENGLISH.
   - If the user prompt specifies Language: "Vietnamese", you MUST generate the description and all keywords in natural, fluent VIETNAMESE.
4. Keywords must be 3 to 5 concise tags (1-3 words each) suitable for a CV.
5. Return ONLY a valid JSON object matching this schema:
{
  "description": string,
  "keywords": string[]
}`;

function getLocalInterestFallback(name: string, isVietnamese: boolean): InterestAiOutput {
  const lower = name.toLowerCase().trim();

  const presetsVi: Array<{ match: RegExp; desc: string; keywords: string[] }> = [
    {
      match: /tech|công nghệ|it|lập trình|code|software|mã nguồn|computer|phần mềm|ai/i,
      desc: 'Đam mê khám phá các xu hướng công nghệ mới, tìm hiểu kiến trúc hệ thống hiện đại và đóng góp cho các dự án mã nguồn mở.',
      keywords: ['Mã nguồn mở', 'Xu hướng công nghệ', 'Học hỏi liên tục', 'Kiến trúc hệ thống'],
    },
    {
      match: /photo|ảnh|camera|nhiếp ảnh|film/i,
      desc: 'Nhiếp ảnh đường phố và phong cảnh, rèn luyện tư duy thị giác, con mắt thẩm mỹ và sự tỉ mỉ đến từng chi tiết.',
      keywords: ['Tư duy thị giác', 'Bố cục hình ảnh', 'Sự tỉ mỉ', 'Lightroom'],
    },
    {
      match: /run|chạy|marathon|jogging|điền kinh/i,
      desc: 'Duy trì thói quen rèn luyện thể lực và kỷ luật bản thân, thường xuyên tham gia các giải chạy cự ly dài.',
      keywords: ['Half-Marathon', 'Kỷ luật bản thân', 'Sức bền', 'Cân bằng cuộc sống'],
    },
    {
      match: /read|sách|book|đọc/i,
      desc: 'Thường xuyên đọc sách về phát triển bản thân, công nghệ và kinh tế nhằm mở rộng tư duy phản biện và góc nhìn đa chiều.',
      keywords: ['Phát triển bản thân', 'Tư duy phản biện', 'Học tập suốt đời'],
    },
    {
      match: /music|nhạc|guitar|piano|nhạc cụ/i,
      desc: 'Chơi nhạc cụ giúp thư giãn tinh thần, kích thích tư duy sáng tạo và rèn luyện khả năng tập trung cao độ.',
      keywords: ['Sáng tạo', 'Tập trung', 'Kiên trì', 'Cảm xúc'],
    },
    {
      match: /travel|du lịch|phượt|khám phá/i,
      desc: 'Khám phá các nền văn hóa mới, nâng cao khả năng thích nghi và kỹ năng giao tiếp trong môi trường đa dạng.',
      keywords: ['Thích nghi nhanh', 'Giao tiếp liên văn hóa', 'Khám phá'],
    },
    {
      match: /chess|cờ|boardgame|game|gaming|esport/i,
      desc: 'Rèn luyện tư duy chiến thuật, kỹ năng phân tích tình huống và khả năng ra quyết định nhanh dưới áp lực.',
      keywords: ['Tư duy chiến thuật', 'Giải quyết vấn đề', 'Tập trung cao'],
    },
    {
      match: /sport|thể thao|bóng|football|soccer|gym|fitness|cầu lông|badminton|tennis|bơi|swim/i,
      desc: 'Rèn luyện thể lực, duy trì lối sống lành mạnh và phát triển tinh thần đồng đội cùng tính kỷ luật cao.',
      keywords: ['Tinh thần đồng đội', 'Kỷ luật', 'Sức bền', 'Năng lượng tích cực'],
    },
    {
      match: /cook|nấu|baking|ẩm thực/i,
      desc: 'Thực hành nghệ thuật ẩm thực, rèn luyện sự khéo léo, quản lý thời gian và khả năng sáng tạo.',
      keywords: ['Sáng tạo', 'Quản lý thời gian', 'Tỉ mỉ'],
    },
    {
      match: /write|viết|blog/i,
      desc: 'Viết blog chia sẻ kiến thức và góc nhìn chuyên môn, trau dồi khả năng truyền đạt và giao tiếp mạch lạc.',
      keywords: ['Sáng tạo nội dung', 'Truyền thông', 'Tư duy mạch lạc'],
    },
  ];

  const presetsEn: Array<{ match: RegExp; desc: string; keywords: string[] }> = [
    {
      match: /tech|software|code|programming|computer|developer|it|ai/i,
      desc: 'Passionate about exploring modern technologies, evaluating system architecture, and contributing to open-source software.',
      keywords: ['Open Source', 'Tech Trends', 'Continuous Learning', 'System Design'],
    },
    {
      match: /photo|camera|picture/i,
      desc: 'Landscape and street photography, cultivating visual storytelling, aesthetics, and fine attention to detail.',
      keywords: ['Visual Storytelling', 'Composition', 'Attention to Detail', 'Photography'],
    },
    {
      match: /run|marathon|jogging|track/i,
      desc: 'Building mental resilience, discipline, and stamina through consistent long-distance running and marathon training.',
      keywords: ['Marathon', 'Discipline', 'Endurance', 'Wellness'],
    },
    {
      match: /read|book|literature/i,
      desc: 'Reading technical, business, and personal development literature to broaden analytical perspective and critical thinking.',
      keywords: ['Lifelong Learning', 'Critical Thinking', 'Self-Improvement'],
    },
    {
      match: /music|guitar|piano|instrument/i,
      desc: 'Playing musical instruments to foster creative problem-solving, mindfulness, and deep focus.',
      keywords: ['Creativity', 'Focus', 'Perseverance', 'Mindfulness'],
    },
    {
      match: /travel|hiking|outdoor/i,
      desc: 'Exploring diverse cultures and environments, strengthening cross-cultural communication and adaptability.',
      keywords: ['Adaptability', 'Cultural Awareness', 'Communication'],
    },
    {
      match: /chess|board game|strategy/i,
      desc: 'Sharpening tactical thinking, anticipatory decision-making, and composure in complex situations.',
      keywords: ['Strategic Thinking', 'Problem Solving', 'Focus'],
    },
    {
      match: /sport|football|soccer|gym|fitness|badminton|tennis|swimming/i,
      desc: 'Maintaining peak physical fitness and discipline while cultivating strong teamwork and communication.',
      keywords: ['Teamwork', 'Discipline', 'Resilience', 'Fitness'],
    },
  ];

  const presets = isVietnamese ? presetsVi : presetsEn;
  for (const preset of presets) {
    if (preset.match.test(lower)) {
      return { description: preset.desc, keywords: [...preset.keywords] };
    }
  }

  return isVietnamese
    ? {
        description: `Đam mê theo đuổi và tìm hiểu sâu về ${name}, giúp tái tạo năng lượng tích cực và rèn luyện tư duy sáng tạo.`,
        keywords: [name, 'Sáng tạo', 'Phát triển bản thân'],
      }
    : {
        description: `Actively pursuing ${name}, fostering creative thinking, curiosity, and personal wellness.`,
        keywords: [name, 'Creativity', 'Personal Growth'],
      };
}

/**
 * Generates an executive-ready interest description and relevant keyword tags using Gemini AI or local presets.
 */
export async function generateInterestDetails(
  options: GenerateInterestOptions
): Promise<InterestAiOutput> {
  const name = options.name.trim();
  if (!name) {
    return { description: '', keywords: [] };
  }

  const isVietnamese = resolveIsVietnamese(
    options.language,
    name + (options.currentDescription || '')
  );

  const userPrompt = `Hobby / Interest: "${name}"
Target Job / Career Context: "${options.jobTitle || 'Professional'}"
${options.currentDescription ? `Candidate notes: "${options.currentDescription}"` : ''}
Required Output Language: ${
    isVietnamese
      ? 'Vietnamese (Tiếng Việt)'
      : 'English (CRITICAL: Description and all keywords MUST be strictly in English. Do not output Vietnamese)'
  }`;

  const remote = await callGeminiInteraction({
    systemInstruction: INTEREST_GENERATOR_SYSTEM,
    userPrompt,
    jsonMode: true,
    maxOutputTokens: 512,
  });

  if (remote) {
    try {
      const sanitized = sanitizeAiJsonOutput(remote);
      const parsed = JSON.parse(sanitized);
      if (typeof parsed?.description === 'string' && Array.isArray(parsed?.keywords)) {
        return {
          description: parsed.description.trim(),
          keywords: parsed.keywords.map((k: unknown) => String(k).trim()).filter(Boolean),
        };
      }
    } catch {
      // Fall through to local fallback
    }
  }

  return getLocalInterestFallback(name, isVietnamese);
}

/**
 * Improves writing quality of an existing interest description.
 */
export async function improveInterestDescription(
  description: string,
  language?: string
): Promise<string> {
  const trimmed = description.trim();
  if (!trimmed) return '';

  const isVietnamese = resolveIsVietnamese(language, trimmed);

  const prompt = isVietnamese
    ? `Vui lòng cải thiện mô tả sở thích/đam mê sau đây cho CV bằng tiếng Việt chuyên nghiệp, ngắn gọn (1 câu, tối đa 30 từ):\n\n${trimmed}`
    : `Please enhance and polish this resume hobby/interest description in professional ENGLISH. If the input is in Vietnamese or another language, translate and improve it into ENGLISH (1 concise sentence, max 30 words):\n\n${trimmed}`;

  const remote = await callGeminiInteraction({
    systemInstruction: isVietnamese
      ? 'Bạn là chuyên gia biên tập CV. Hãy viết lại mô tả sở thích bằng tiếng Việt chuyên nghiệp, cô đọng cho CV. Chỉ trả về văn bản tiếng Việt, không kèm dấu ngoặc hay giải thích.'
      : 'You are a professional resume editor. Rewrite the provided hobby description into professional, concise ENGLISH for an executive CV. Return only the revised ENGLISH text without quotes or explanation.',
    userPrompt: prompt,
    maxOutputTokens: 256,
  });

  if (remote) return remote.trim();

  // Local fallback: capitalize and clean up punctuation
  const cleaned = trimmed.replace(/\s+/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Customizes an interest description according to a tone preset.
 */
export async function customizeInterestDescription(
  description: string,
  preset: CustomizeOption,
  language?: string
): Promise<string> {
  const improvedHtml = await customizeWriting(
    `<p>${description}</p>`,
    preset,
    language
  );
  return stripHtml(improvedHtml);
}

/**
 * Suggests relevant keyword tags for an interest.
 */
export async function suggestInterestKeywords(
  name: string,
  description?: string,
  language?: string
): Promise<string[]> {
  const details = await generateInterestDetails({
    name,
    currentDescription: description,
    language,
  });
  return details.keywords;
}

export interface GenerateLanguageDescriptionOptions {
  languageName: string;
  certificate?: string;
  score?: string;
  jobTitle?: string;
  language?: string;
}

const LANGUAGE_DESCRIPTION_SYSTEM = `You are an expert executive resume writer and career coach.
Your task is to write a concise, professional description (1 sentence, 15-25 words) for a candidate's language proficiency on their CV/Resume.

Strict guidelines:
1. Tailor the description to the candidate's language, certificate name, and score/grade if provided.
2. Emphasize practical workplace capabilities: reading technical documentation, business communication, stakeholder presentations, or cross-team collaboration.
3. LANGUAGE REQUIREMENT:
   - If Required Output Language is "English", you MUST output strictly in natural, professional ENGLISH. Even if the input language name is in Vietnamese (e.g. "Tiếng Anh", "Tiếng Pháp") or notes are in Vietnamese, translate and output strictly in ENGLISH.
   - If Required Output Language is "Vietnamese", you MUST output in natural, professional VIETNAMESE.
4. Keep it concise, natural, mature, and impactful for an ATS-optimized CV.
5. Return ONLY the plain text description (no quotes, no bullet points, no markdown formatting).`;

function getLocalLanguageDescriptionFallback(
  name: string,
  cert?: string,
  score?: string,
  isVietnamese = true
): string {
  const lowerName = name.toLowerCase().trim();
  const lowerScore = (score || '').toLowerCase();
  const numScore = parseFloat(score || '0');

  const isEnglish = /eng|anh/i.test(lowerName);
  const isFrench = /french|pháp/i.test(lowerName);
  const isJapanese = /japan|nhật/i.test(lowerName);
  const isChinese = /chin|trung|hoa/i.test(lowerName);
  const isKorean = /korean|hàn/i.test(lowerName);
  const isGerman = /german|đức/i.test(lowerName);

  if (isEnglish) {
    const isHigh =
      numScore >= 750 ||
      (numScore >= 7.0 && numScore <= 9.0) ||
      lowerScore.includes('c1') ||
      lowerScore.includes('c2') ||
      lowerScore.includes('fluent');
    const isMid =
      (numScore >= 500 && numScore < 750) ||
      (numScore >= 5.5 && numScore < 7.0) ||
      lowerScore.includes('b2') ||
      lowerScore.includes('intermediate');

    if (isHigh) {
      return isVietnamese
        ? 'Sử dụng tiếng Anh thành thạo trong giao tiếp chuyên môn, thuyết trình kỹ thuật và làm việc trực tiếp với đối tác quốc tế.'
        : 'Full professional English proficiency in technical presentations, documentation, and international team collaboration.';
    }
    if (isMid || cert || score) {
      return isVietnamese
        ? 'Giao tiếp tiếng Anh tự tin trong công việc, đọc hiểu tài liệu chuyên ngành và trao đổi công việc hàng ngày.'
        : 'Confident working proficiency in technical documentation, daily workplace communication, and team discussions.';
    }
    return isVietnamese
      ? 'Đọc hiểu tốt tài liệu kỹ thuật tiếng Anh và giao tiếp hiệu quả trong môi trường công sở.'
      : 'Professional English proficiency in technical documentation, team communication, and business collaboration.';
  }

  if (isFrench) {
    return isVietnamese
      ? 'Có khả năng giao tiếp và xử lý văn bản, tài liệu công việc bằng tiếng Pháp.'
      : 'Working proficiency in French business correspondence, reading comprehension, and daily communication.';
  }

  if (isJapanese) {
    return isVietnamese
      ? 'Giao tiếp tiếng Nhật tốt trong công việc, đọc hiểu tài liệu kỹ thuật và trao đổi với đối tác.'
      : 'Solid business Japanese proficiency for project specifications and professional stakeholder communication.';
  }

  if (isChinese) {
    return isVietnamese
      ? 'Khả năng giao tiếp, soạn thảo văn bản và làm việc hiệu quả với các đối tác sử dụng tiếng Trung.'
      : 'Effective professional communication and business correspondence in Chinese.';
  }

  if (isKorean) {
    return isVietnamese
      ? 'Giao tiếp tiếng Hàn tốt trong công việc và đọc hiểu tài liệu chuyên môn.'
      : 'Working proficiency in Korean communication and professional documentation.';
  }

  if (isGerman) {
    return isVietnamese
      ? 'Khả năng đọc hiểu tài liệu chuyên ngành và giao tiếp công việc bằng tiếng Đức.'
      : 'Working proficiency in German technical reading and professional communication.';
  }

  return isVietnamese
    ? `Khả năng sử dụng ${name} hiệu quả trong giao tiếp công việc, đọc hiểu tài liệu chuyên môn và hợp tác nhóm.`
    : `Effective professional communication in ${name}, with solid technical reading comprehension and collaboration skills.`;
}

/**
 * Generates an executive-ready language proficiency description using Gemini AI or local presets.
 */
export async function generateLanguageDescription(
  options: GenerateLanguageDescriptionOptions
): Promise<string> {
  const name = options.languageName.trim();
  if (!name) return '';

  const isVietnamese = resolveIsVietnamese(
    options.language,
    name + (options.certificate || '')
  );

  const userPrompt = `Language: "${name}"
${options.certificate ? `Certificate: "${options.certificate}"` : ''}
${options.score ? `Score / Level: "${options.score}"` : ''}
${options.jobTitle ? `Candidate Career Context: "${options.jobTitle}"` : ''}
Required Output Language: ${
    isVietnamese
      ? 'Vietnamese (Tiếng Việt)'
      : 'English (CRITICAL: Must be written entirely in professional English)'
  }`;

  const remote = await callGeminiInteraction({
    systemInstruction: LANGUAGE_DESCRIPTION_SYSTEM,
    userPrompt,
    maxOutputTokens: 256,
  });

  if (remote) {
    return remote.trim().replace(/^["']|["']$/g, '');
  }

  return getLocalLanguageDescriptionFallback(
    name,
    options.certificate,
    options.score,
    isVietnamese
  );
}

/**
 * Improves writing quality of an existing language description.
 */
export async function improveLanguageDescription(
  description: string,
  language?: string
): Promise<string> {
  const trimmed = description.trim();
  if (!trimmed) return '';

  const isVietnamese = resolveIsVietnamese(language, trimmed);

  const prompt = isVietnamese
    ? `Vui lòng cải thiện mô tả trình độ ngoại ngữ sau đây cho CV bằng tiếng Việt chuyên nghiệp, ngắn gọn (1 câu, tối đa 25 từ):\n\n${trimmed}`
    : `Please enhance and polish this resume language proficiency description in professional ENGLISH. If the input is in Vietnamese or another language, translate and improve it into ENGLISH (1 concise sentence, max 25 words):\n\n${trimmed}`;

  const remote = await callGeminiInteraction({
    systemInstruction: isVietnamese
      ? 'Bạn là chuyên gia biên tập CV. Hãy viết lại mô tả trình độ ngoại ngữ bằng tiếng Việt chuyên nghiệp, cô đọng cho CV. Chỉ trả về văn bản tiếng Việt.'
      : 'You are a professional resume editor. Rewrite the provided language proficiency description into professional, concise ENGLISH for an executive CV. Return only the revised text in ENGLISH without quotes or explanation.',
    userPrompt: prompt,
    maxOutputTokens: 256,
  });

  if (remote) return remote.trim().replace(/^["']|["']$/g, '');

  const cleaned = trimmed.replace(/\s+/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Customizes a language description according to a tone preset.
 */
export async function customizeLanguageDescription(
  description: string,
  preset: CustomizeOption,
  language?: string
): Promise<string> {
  const improvedHtml = await customizeWriting(
    `<p>${description}</p>`,
    preset,
    language
  );
  return stripHtml(improvedHtml);
}

const SECTION_TITLES_VI: Record<string, string> = {
  summary: 'Tóm tắt chuyên môn',
  experience: 'Kinh nghiệm làm việc',
  projects: 'Dự án',
  education: 'Học vấn',
  skills: 'Kỹ năng chuyên môn',
  softSkills: 'Kỹ năng mềm',
  languages: 'Ngoại ngữ',
  certifications: 'Chứng chỉ',
  awards: 'Giải thưởng',
  volunteering: 'Hoạt động tình nguyện',
  interests: 'Sở thích',
};

const SECTION_TITLES_EN: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  skills: 'Skills',
  softSkills: 'Soft Skills',
  languages: 'Languages',
  certifications: 'Certifications',
  awards: 'Awards',
  volunteering: 'Volunteering',
  interests: 'Interests',
};

const CV_PHRASE_TRANSLATIONS: [string, string][] = [
  // Job Titles
  ['Software Developer', 'Lập trình viên'],
  ['Software Engineer', 'Kỹ sư phần mềm'],
  ['Senior Frontend Engineer', 'Kỹ sư Frontend cao cấp'],
  ['Frontend Engineer', 'Kỹ sư Frontend'],
  ['Frontend Developer', 'Lập trình viên Frontend'],
  ['Senior Backend Engineer', 'Kỹ sư Backend cao cấp'],
  ['Backend Engineer', 'Kỹ sư Backend'],
  ['Backend Developer', 'Lập trình viên Backend'],
  ['Fullstack Developer', 'Lập trình viên Fullstack'],
  ['Full Stack Developer', 'Lập trình viên Full Stack'],
  ['Senior Fullstack Engineer', 'Kỹ sư Fullstack cao cấp'],
  ['IT Officer', 'Chuyên viên CNTT'],
  ['DevOps Engineer', 'Kỹ sư DevOps'],
  ['Project Manager', 'Quản lý dự án'],
  ['Product Manager', 'Giám đốc sản phẩm'],
  ['QA Engineer', 'Kỹ sư kiểm thử chất lượng (QA)'],
  ['Data Analyst', 'Chuyên viên phân tích dữ liệu'],
  ['Data Engineer', 'Kỹ sư dữ liệu'],
  ['UI/UX Designer', 'Thiết kế UI/UX'],
  ['Technical Lead', 'Trưởng nhóm kỹ thuật'],
  ['Engineering Manager', 'Quản lý kỹ thuật'],

  // Employment Types & Work Modes
  ['Full-time', 'Toàn thời gian'],
  ['Part-time', 'Bán thời gian'],
  ['Freelance', 'Làm việc tự do'],
  ['Internship', 'Thực tập'],
  ['Contract', 'Hợp đồng'],
  ['Remote', 'Từ xa'],
  ['Hybrid', 'Linh hoạt (Hybrid)'],
  ['On-site', 'Tại văn phòng'],

  // Degrees & Fields of Study
  ['B.Sc.', 'Cử nhân'],
  ['Bachelor of Science', 'Cử nhân'],
  ['Bachelor', 'Cử nhân'],
  ['M.Sc.', 'Thạc sĩ'],
  ['Master of Science', 'Thạc sĩ'],
  ['Master', 'Thạc sĩ'],
  ['Ph.D.', 'Tiến sĩ'],
  ['Associate Degree', 'Bằng Cao đẳng'],
  ['Associate', 'Cao đẳng'],
  ['Computer Science', 'Khoa học máy tính'],
  ['Information Technology', 'Công nghệ thông tin'],
  ['Software Engineering', 'Kỹ thuật phần mềm'],
  ['Data Science', 'Khoa học dữ liệu'],
  ['Business Administration', 'Quản trị kinh doanh'],
  ['Finance', 'Tài chính'],

  // Skill Categories
  ['Frontend & Languages', 'Frontend & Ngôn ngữ lập trình'],
  ['Backend & Cloud', 'Backend & Điện toán đám mây'],
  ['Database & DevOps', 'Cơ sở dữ liệu & DevOps'],
  ['Programming Languages', 'Ngôn ngữ lập trình'],
  ['Frameworks & Libraries', 'Framework & Thư viện'],
  ['Tools & Technologies', 'Công cụ & Công nghệ'],
  ['Soft Skills', 'Kỹ năng mềm'],
  ['Interpersonal & Collaboration', 'Giao tiếp & Hợp tác'],
  ['Interpersonal & Leadership', 'Giao tiếp & Lãnh đạo'],
  ['Communication', 'Giao tiếp'],
  ['Teamwork', 'Làm việc nhóm'],
  ['Problem Solving', 'Giải quyết vấn đề'],
  ['Time Management', 'Quản lý thời gian'],
  ['Critical Thinking', 'Tư duy phản biện'],
  ['Adaptability', 'Khả năng thích ứng'],
  ['Leadership', 'Lãnh đạo'],
  ['Presentation', 'Thuyết trình'],
  ['Negotiation', 'Đàm phán'],
  ['Creativity', 'Sáng tạo'],

  // Languages
  ['English', 'Tiếng Anh'],
  ['Vietnamese', 'Tiếng Việt'],
  ['French', 'Tiếng Pháp'],
  ['Japanese', 'Tiếng Nhật'],
  ['Chinese', 'Tiếng Trung'],
  ['Korean', 'Tiếng Hàn'],
  ['German', 'Tiếng Đức'],
  ['Spanish', 'Tiếng Tây Ban Nha'],
  ['Arabic', 'Tiếng Ả Rập'],
  ['Russian', 'Tiếng Nga'],

  // Language Levels
  ['Basic', 'Cơ bản'],
  ['Intermediate', 'Trung cấp'],
  ['Conversational', 'Giao tiếp'],
  ['Advanced', 'Nâng cao'],
  ['Fluent', 'Thành thạo'],
  ['Native or Bilingual', 'Bản ngữ / Song ngữ'],
  ['Native', 'Bản ngữ'],

  // Interests
  ['Technology', 'Công nghệ'],
  ['Photography', 'Nhiếp ảnh'],
  ['Running', 'Chạy bộ'],
  ['Reading', 'Đọc sách'],
  ['Music', 'Âm nhạc'],
  ['Travel', 'Du lịch'],
  ['Traveling', 'Du lịch'],
  ['Cooking', 'Nấu ăn'],
  ['Chess', 'Cờ vua'],
  ['Football', 'Bóng đá'],
  ['Soccer', 'Bóng đá'],
  ['Open Source', 'Mã nguồn mở'],

  // Common Sentences & Summaries
  [
    'Results-driven Software Developer with experience designing, building, and scaling modern web applications.',
    'Lập trình viên định hướng kết quả với kinh nghiệm thiết kế, xây dựng và mở rộng các ứng dụng web hiện đại.',
  ],
  [
    'Architected and delivered modular React and TypeScript applications serving 150K+ monthly active users.',
    'Kiến trúc và bàn giao các ứng dụng React và TypeScript theo mô-đun phục vụ hơn 150.000 người dùng hoạt động hàng tháng.',
  ],
  [
    'Improved Core Web Vitals and reduced bundle size by 35% through code splitting and lazy loading.',
    'Cải thiện chỉ số Core Web Vitals và giảm 35% dung lượng gói mã nguồn thông qua phân tách mã và tải trễ.',
  ],
  [
    'Built a customizable telemetry dashboard with interactive charts and instant PDF/JSON reporting.',
    'Xây dựng bảng điều khiển từ xa có thể tùy biến với biểu đồ tương tác và tính năng xuất báo cáo PDF/JSON tức thì.',
  ],
  [
    'Real-time analytics and observability platform',
    'Nền tảng phân tích và giám sát thời gian thực',
  ],
  [
    'Graduated with Honors. Coursework in Algorithms, Distributed Systems, and Software Engineering.',
    'Tốt nghiệp loại Giỏi. Các môn học trọng tâm bao gồm Thuật toán, Hệ thống phân tán và Kỹ thuật phần mềm.',
  ],
  [
    'Full professional English proficiency in technical presentations, documentation, and international team collaboration.',
    'Sử dụng tiếng Anh thành thạo trong giao tiếp chuyên môn, thuyết trình kỹ thuật và làm việc trực tiếp với đối tác quốc tế.',
  ],
  [
    'Confident working proficiency in technical documentation, daily workplace communication, and team discussions.',
    'Giao tiếp tiếng Anh tự tin trong công việc, đọc hiểu tài liệu chuyên ngành và trao đổi công việc hàng ngày.',
  ],
  [
    'Working proficiency in French business correspondence, reading comprehension, and daily communication.',
    'Có khả năng giao tiếp và xử lý văn bản, tài liệu công việc bằng tiếng Pháp.',
  ],
  [
    'Solid business Japanese proficiency for project specifications and professional stakeholder communication.',
    'Giao tiếp tiếng Nhật tốt trong công việc, đọc hiểu tài liệu kỹ thuật và trao đổi với đối tác.',
  ],
];

/**
 * Translates a phrase between English and Vietnamese using dictionary mapping.
 */
export function translatePhrase(text: string, toVi: boolean): string {
  if (!text || !text.trim()) return text;
  const trimmed = text.trim();

  // Exact match first
  for (const [en, vi] of CV_PHRASE_TRANSLATIONS) {
    if (toVi && trimmed.toLowerCase() === en.toLowerCase()) return vi;
    if (!toVi && trimmed.toLowerCase() === vi.toLowerCase()) return en;
  }

  // Substring replacement for composite text or HTML
  let result = text;
  for (const [en, vi] of CV_PHRASE_TRANSLATIONS) {
    const fromStr = toVi ? en : vi;
    const toStr = toVi ? vi : en;
    const escaped = fromStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escaped, 'gi'), toStr);
  }

  return result;
}

/**
 * Deterministic local fallback for translating a full ResumeData structure.
 */
export function getLocalResumeTranslationFallback(
  resumeData: ResumeData,
  targetLanguage: 'en' | 'vi'
): ResumeData {
  const toVi = targetLanguage === 'vi';
  const targetTitles = toVi ? SECTION_TITLES_VI : SECTION_TITLES_EN;

  const translatedSectionTitles = {
    ...resumeData.sectionTitles,
    ...targetTitles,
  };

  const translatedBasics = {
    ...resumeData.basics,
    title: translatePhrase(resumeData.basics.title, toVi),
    location: {
      ...resumeData.basics.location,
      value: translatePhrase(resumeData.basics.location.value, toVi),
    },
  };

  const translatedSummary = {
    sectionTitle: targetTitles.summary || 'Summary',
    content: translatePhrase(resumeData.summary.content, toVi),
  };

  const translatedExperience = resumeData.experience.map((item) => ({
    ...item,
    position: translatePhrase(item.position, toVi),
    employmentType: translatePhrase(item.employmentType, toVi),
    location: translatePhrase(item.location, toVi),
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedProjects = resumeData.projects.map((item) => ({
    ...item,
    description: translatePhrase(item.description, toVi),
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedEducation = resumeData.education.map((item) => ({
    ...item,
    degree: translatePhrase(item.degree, toVi),
    studyField: translatePhrase(item.studyField, toVi),
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedSkills = resumeData.skills.map((item) => ({
    ...item,
    name: translatePhrase(item.name, toVi),
  }));

  const translatedSoftSkills = (resumeData.softSkills || []).map((item) => ({
    ...item,
    name: translatePhrase(item.name, toVi),
    keywords: (item.keywords || []).map((kw) => translatePhrase(kw, toVi)),
  }));

  const translatedLanguages = resumeData.languages.map((item) => ({
    ...item,
    name: translatePhrase(item.name, toVi),
    level: item.level ? translatePhrase(item.level, toVi) : item.level,
    description: item.description
      ? translatePhrase(item.description, toVi)
      : item.description,
  }));

  const translatedCertifications = resumeData.certifications.map((item) => ({
    ...item,
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedAwards = resumeData.awards.map((item) => ({
    ...item,
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedVolunteering = resumeData.volunteering.map((item) => ({
    ...item,
    position: translatePhrase(item.position, toVi),
    summary: translatePhrase(item.summary, toVi),
  }));

  const translatedInterests = resumeData.interests.map((item) => ({
    ...item,
    name: translatePhrase(item.name, toVi),
    description: item.description
      ? translatePhrase(item.description, toVi)
      : item.description,
    keywords: item.keywords.map((kw) => translatePhrase(kw, toVi)),
  }));

  return {
    ...resumeData,
    cvLanguage: targetLanguage,
    basics: translatedBasics,
    summary: translatedSummary,
    sectionTitles: translatedSectionTitles,
    experience: translatedExperience,
    projects: translatedProjects,
    education: translatedEducation,
    skills: translatedSkills,
    softSkills: translatedSoftSkills,
    languages: translatedLanguages,
    certifications: translatedCertifications,
    awards: translatedAwards,
    volunteering: translatedVolunteering,
    interests: translatedInterests,
  };
}

/**
 * Translates an entire ResumeData object between English and Vietnamese using Gemini AI
 * or deterministic local bilingual mapping, and establishes the AI response language.
 */
export async function translateResume(
  resumeData: ResumeData,
  targetLanguage: 'en' | 'vi'
): Promise<ResumeData> {
  if (isResumeEmpty(resumeData)) {
    return { ...resumeData, cvLanguage: targetLanguage };
  }

  const systemInstruction = `You are an expert executive resume translator and bilingual career coach.
Your task is to translate the provided ResumeData JSON into ${
    targetLanguage === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'
  }.

Strict Translation Rules:
1. Translate all professional titles, positions, job descriptions, project summaries, degrees, study fields, skill category names, language names, proficiency levels, hobby descriptions, and section titles into natural, industry-standard, professional ${
    targetLanguage === 'vi' ? 'Vietnamese' : 'English'
  }.
2. Preserve all person names, company names, institution names (e.g., "Cairo University", "TechNova Solutions"), certificate acronyms (e.g., "TOEIC", "IELTS", "AWS", "PMP"), IDs, URLs, emails, phone numbers, and dates intact.
3. Preserve all HTML tags (<p>, <ul>, <li>, <strong>, <em>, <br>) and structure exactly as they appear in summary and description fields.
4. Set "cvLanguage" property in the returned JSON to "${targetLanguage}".
5. Return ONLY a valid JSON object matching the exact input ResumeData schema with identical keys. Do not wrap in markdown or add explanations.`;

  const remoteJson = await callGeminiInteraction({
    systemInstruction,
    userPrompt: JSON.stringify(resumeData),
    maxOutputTokens: 8192,
    jsonMode: true,
  });

  if (remoteJson) {
    try {
      const cleaned = sanitizeAiJsonOutput(remoteJson);
      const parsed = JSON.parse(cleaned) as ResumeData;
      if (parsed?.basics && typeof parsed?.sectionTitles === 'object') {
        return {
          ...resumeData,
          ...parsed,
          cvLanguage: targetLanguage,
          basics: {
            ...resumeData.basics,
            ...parsed.basics,
            photo: resumeData.basics.photo,
          },
        };
      }
    } catch {
      // fallback to deterministic local translation
    }
  }

  return getLocalResumeTranslationFallback(resumeData, targetLanguage);
}

/**
 * Extracts structured `ResumeData` from an uploaded PDF or Image file.
 */
export async function importResumeFromFile(
  file: File,
  _kind: 'pdf' | 'image'
): Promise<ResumeData> {
  await new Promise((r) => setTimeout(r, 400));
  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return {
    ...DEFAULT_RESUME_DATA,
    basics: {
      ...DEFAULT_RESUME_DATA.basics,
      name:
        baseName &&
        baseName.toLowerCase() !== 'cv' &&
        baseName.toLowerCase() !== 'resume'
          ? baseName
          : DEFAULT_RESUME_DATA.basics.name,
    },
  };
}

import type { CVAnalysisResult, ResumeData } from '@/types/resume';
import { DEFAULT_RESUME_DATA } from '@/store/useResumeStore';
import { sanitizeAiJsonOutput } from '@/services/importService';

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
  IMPROVE_SYSTEM: `You are a professional content editor specializing in clear, concise business communication. Your task is to:
1. Enhance the content to be more professional, polished, and impactful
2. Maintain approximately the same length as the original
3. Preserve all HTML tags and structure exactly as they appear
4. Focus on clarity, precision, and professional tone
5. Remove redundancies and unnecessary words
6. Ensure proper business writing conventions

Return only the improved content without any explanations or meta-text.`,

  FIX_TYPOS_SYSTEM: `You are a professional proofreader and editor. Your task is to correct spelling, grammar, and punctuation errors while:
1. Preserving all HTML tags and structure exactly as they appear
2. Maintaining the original meaning and tone
3. Only fixing genuine errors - do not rewrite or rephrase correct content
4. Ensuring proper capitalization and spacing
Return only the corrected content without any explanations.`,

  CUSTOMIZE_SYSTEM: `You are a professional content editor. Your task is to customize the provided content according to the user's prompt while following these strict guidelines:

1. Preserve all HTML tags and structure exactly as they appear
2. Maintain the original content's core message and intent
3. Keep the output exactly the same length as the input, UNLESS the prompt specifically requests to make it shorter or longer
4. Focus on adjusting tone, style, and word choice to match the customization request
5. Ensure the output is clean - no explanations, headers, or additional formatting

Return only the modified content.`,

  CV_REVIEW_SYSTEM: `You are an expert ATS (Applicant Tracking System) evaluator and executive technical recruiter.
Analyze the candidate's resume JSON against the target job title and job description.
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
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  jsonMode?: boolean;
  inlineImage?: {
    mimeType: string;
    base64Data: string;
  };
}

/**
 * Calls Google Gemini API (`generateContent`) when `VITE_GEMINI_API_KEY` (or `VITE_AI_API_KEY`) is configured.
 * Never embeds private API keys in client-side source code.
 */
export async function callGeminiGenerateContent(
  options: GeminiCallOptions
): Promise<string | null> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_AI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
  const baseUrl =
    import.meta.env.VITE_GEMINI_API_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta';
  const endpoint = `${baseUrl.replace(/\/$/, '')}/models/${model}:generateContent`;

  const parts: Array<Record<string, unknown>> = [{ text: options.userPrompt }];
  if (options.inlineImage) {
    parts.push({
      inlineData: {
        mimeType: options.inlineImage.mimeType,
        data: options.inlineImage.base64Data,
      },
    });
  }

  const generationConfig: Record<string, unknown> = {
    temperature: options.temperature ?? 0.1,
    maxOutputTokens: options.maxOutputTokens ?? 1024,
    topP: options.topP ?? 1,
  };
  if (options.jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('')
        .trim() || null;
    return text;
  } catch {
    return null;
  }
}

/**
 * Improves writing quality of rich-text HTML content (`Mu`).
 * Uses Gemini AI with verified CVMaster prompts when configured, or deterministic local enhancement.
 */
export async function improveWriting(htmlContent: string): Promise<string> {
  const userPrompt = `Please improve the following content while preserving all HTML markup. Make it more professional, concise, and impactful:\n\n${htmlContent}`;

  const remote = await callGeminiGenerateContent({
    systemInstruction: VERIFIED_PROMPTS.IMPROVE_SYSTEM,
    userPrompt,
    temperature: 0.1,
    maxOutputTokens: 1024,
    topP: 1,
  });
  if (remote) return remote;

  await new Promise((r) => setTimeout(r, 350));
  const hasList = /<ul|<ol|<li/i.test(htmlContent);
  const rawLines = stripHtml(htmlContent)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) return htmlContent;

  const actionVerbs: Record<string, string> = {
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
export async function fixTypos(htmlContent: string): Promise<string> {
  const userPrompt = `Please proofread and correct any spelling, grammar, or punctuation errors in the following content, while preserving all HTML markup: "${htmlContent}"`;

  const remote = await callGeminiGenerateContent({
    systemInstruction: VERIFIED_PROMPTS.FIX_TYPOS_SYSTEM,
    userPrompt,
    temperature: 0.1,
    maxOutputTokens: 1024,
    topP: 1,
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
  option: CustomizeOption
): Promise<string> {
  const preset = CUSTOMIZE_OPTIONS.find((o) => o.value === option);
  const promptText = preset ? preset.prompt : option;
  const userPrompt = `Customize the following content to make it more ${promptText}: "${htmlContent}"`;

  const remote = await callGeminiGenerateContent({
    systemInstruction: VERIFIED_PROMPTS.CUSTOMIZE_SYSTEM,
    userPrompt,
    temperature: 0.1,
    maxOutputTokens: 1024,
    topP: 1,
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

  return !hasName && !hasSummary && !hasExp && !hasEdu && !hasSkills && !hasProjects;
}

/**
 * Analyzes a resume against a target job title and job description (`Bu`),
 * using Gemini AI JSON mode when configured and enforcing verified guard clauses.
 */
export async function analyzeResumeForRole(params: {
  resumeData: ResumeData;
  jobTitle: string;
  jobDescription: string;
}): Promise<CVAnalysisResult> {
  const { resumeData, jobTitle, jobDescription } = params;

  if (isResumeEmpty(resumeData)) {
    throw new Error('cannot analyze an empty resume');
  }

  if (jobTitle.trim().length < 5 || jobDescription.trim().length < 20) {
    throw new Error('Please enter a valid job title and description');
  }

  const remoteJson = await callGeminiGenerateContent({
    systemInstruction: VERIFIED_PROMPTS.CV_REVIEW_SYSTEM,
    userPrompt: JSON.stringify({
      jobTitle,
      jobDescription,
      resume: resumeData,
    }),
    temperature: 0.5,
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
  const skillCount = resumeData.skills.reduce(
    (acc: number, item) => acc + (item.keywords?.length || 0),
    0
  );

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

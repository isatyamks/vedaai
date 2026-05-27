import Groq from 'groq-sdk';
import { ISection } from '../models/Assignment';
import { env } from '../config/env';

export interface ISectionConfig {
  title: string;
  type: 'MCQ' | 'Short' | 'Long';
  count: number;
  marksPerQuestion: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

const SECTION_INSTRUCTIONS: Record<string, string> = {
  MCQ: 'Choose the correct alternative from the options provided. Each question carries equal marks.',
  Short: 'Answer each question in 50–80 words using precise terminology.',
  Long: 'Answer in detail (300–500 words). Include diagrams or mathematical proofs where applicable.',
};

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export async function generateAssignmentContent(
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string,
  sectionConfigs: ISectionConfig[],
  setName: string = 'A',
  chapters: string[] = [],
  userPrompt?: string,
  existingSets?: any[]
): Promise<ISection[]> {
  const sectionSpec = sectionConfigs
    .map(
      (cfg, i) =>
        `Section ${i + 1}: title="${cfg.title}", type=${cfg.type}, count=${cfg.count}, marks=${cfg.marksPerQuestion}, difficulty=${cfg.difficulty}`
    )
    .join('\n');

  const chapterConstraint =
    chapters.length > 0
      ? `\nSyllabus Chapters to Cover: ${chapters.join(', ')}\nEnsure all generated questions are strictly based on these chapters.`
      : '';

  let editConstraint = '';
  if (userPrompt) {
    const existingSetData = existingSets?.find((s) => s.setName === setName) ?? existingSets?.[0];
    const currentJson = existingSetData ? JSON.stringify(existingSetData.sections, null, 2) : '';
    editConstraint = `
========================================
[EDIT MODE]
Revise the existing test paper per the user's instruction. Keep unchanged questions exactly as-is.

CURRENT PAPER (Set ${setName}):
${currentJson}

USER INSTRUCTION: "${userPrompt}"
========================================`;
  }

  const systemPrompt = `You are an expert academic assessment creator. Return ONLY a raw JSON object with no markdown fences.

JSON shape:
{
  "sections": [
    {
      "title": "string",
      "instruction": "string",
      "questions": [
        {
          "text": "string",
          "options": ["string","string","string","string"],
          "correctAnswer": "string",
          "difficulty": "Easy" | "Moderate" | "Hard",
          "marks": number
        }
      ]
    }
  ]
}

Rules:
- options and correctAnswer are ONLY for MCQ questions
- MCQ must have exactly 4 options
- correctAnswer must exactly match one of the options
- Return valid JSON only, no extra text`;

  const userMessage = `Generate a structured question paper for Set ${setName}.
${editConstraint}

Title: ${title}
Subject: ${subject}
Grade: ${grade}${chapterConstraint}
Instructions: ${additionalInstructions || 'None'}

Sections:
${sectionSpec}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const text = response.choices[0]?.message?.content ?? '';
  const parsed = JSON.parse(text);

  if (!Array.isArray(parsed?.sections)) {
    throw new Error('Groq response missing sections array.');
  }

  const sections = parsed.sections as ISection[];
  sections.forEach((sec: any) => {
    if (!sec.instruction) {
      const firstQ = sec.questions?.[0];
      const type = firstQ?.options?.length ? 'MCQ' : (firstQ?.marks ?? 0) > 6 ? 'Long' : 'Short';
      sec.instruction = SECTION_INSTRUCTIONS[type] ?? 'Answer all questions in this section.';
    }
  });

  return sections;
}

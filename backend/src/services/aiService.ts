import { GoogleGenAI } from '@google/genai';
import { ISection, IQuestion } from '../models/Assignment';

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

export async function generateAssignmentContent(
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string,
  sectionConfigs: ISectionConfig[],
  setName: string = 'A',
  chapters: string[] = []
): Promise<ISection[]> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  return await callGemini(title, subject, grade, additionalInstructions, sectionConfigs, apiKey, setName, chapters);
}

async function callGemini(
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string,
  sectionConfigs: ISectionConfig[],
  apiKey: string,
  setName: string,
  chapters: string[]
): Promise<ISection[]> {
  const ai = new GoogleGenAI({ apiKey });

  const sectionSpec = sectionConfigs
    .map(
      (cfg, i) =>
        `Section ${i + 1}: title="${cfg.title}", type=${cfg.type}, count=${cfg.count}, marks=${cfg.marksPerQuestion}, difficulty=${cfg.difficulty}`
    )
    .join('\n');

  const chapterConstraint = chapters && chapters.length > 0
    ? `\nSyllabus Chapters to Cover: ${chapters.join(', ')}\nEnsure all generated questions are strictly based on and cover these specific chapters.`
    : '';

  const prompt = `You are an expert academic assessment creator. Generate a structured question paper.
This is specifically for Set ${setName} of a multi-set exam. Make the questions distinct from other sets but identical in difficulty, sections, and marks structure to avoid cheating.

Title: ${title}
Subject: ${subject}
Grade: ${grade}${chapterConstraint}
Instructions: ${additionalInstructions || 'None'}

Sections:
${sectionSpec}

Return ONLY a raw JSON object — no markdown fences — matching this exact shape:
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
- options and correctAnswer are ONLY present for MCQ type questions
- MCQ must have exactly 4 options
- correctAnswer must match one of the options exactly`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.7 },
  });

  const text = response.text ?? '';
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed?.sections)) {
    throw new Error('Gemini response missing sections array.');
  }

  const sections = parsed.sections as ISection[];
  sections.forEach((sec: any) => {
    if (!sec.instruction) {
      const firstQ = sec.questions?.[0];
      const type = firstQ?.options?.length ? 'MCQ' : (firstQ?.marks ?? 0) > 6 ? 'Long' : 'Short';
      sec.instruction = SECTION_INSTRUCTIONS[type] || 'Answer all questions in this section.';
    }
  });

  return sections;
}

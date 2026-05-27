import { GoogleGenAI } from '@google/genai';
import { ISection, IQuestion } from '../models/Assignment';

export interface ISectionConfig {
  title: string;
  type: 'MCQ' | 'Short' | 'Long';
  count: number;
  marksPerQuestion: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

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

  if (apiKey) {
    try {
      return await callGemini(title, subject, grade, additionalInstructions, sectionConfigs, apiKey, setName, chapters);
    } catch {
      return buildFallback(title, subject, sectionConfigs, setName);
    }
  }

  await new Promise((r) => setTimeout(r, 3000));
  return buildFallback(title, subject, sectionConfigs, setName);
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

type QuestionTemplate =
  | { text: string; options: string[]; correctAnswer: string }
  | { text: string };

interface SubjectDB {
  MCQ: QuestionTemplate[];
  Short: QuestionTemplate[];
  Long: QuestionTemplate[];
}

const SCIENCE_DB: SubjectDB = {
  MCQ: [
    { text: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correctAnswer: 'Mitochondria' },
    { text: 'What is the chemical symbol for Gold?', options: ['Ag', 'Au', 'Fe', 'Gd'], correctAnswer: 'Au' },
    { text: 'Which planet has the most prominent ring system?', options: ['Mars', 'Jupiter', 'Saturn', 'Neptune'], correctAnswer: 'Saturn' },
    { text: 'What is the acceleration due to gravity on Earth?', options: ['9.8 m/s²', '8.9 m/s²', '10.5 m/s²', '7.2 m/s²'], correctAnswer: '9.8 m/s²' },
    { text: 'Which gas is most abundant in Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correctAnswer: 'Nitrogen' },
    { text: 'What is the pH of pure water?', options: ['5.5', '7.0', '8.5', '9.0'], correctAnswer: '7.0' },
  ],
  Short: [
    { text: 'Briefly explain the process of Photosynthesis.' },
    { text: 'State Newton\'s Second Law of Motion with its equation.' },
    { text: 'Describe the differences between covalent and ionic bonds.' },
    { text: 'What is the greenhouse effect and how does it affect global temperatures?' },
    { text: 'Explain the difference between renewable and non-renewable energy sources.' },
  ],
  Long: [
    { text: 'Detail the entire process of Mitosis, explaining each phase: Prophase, Metaphase, Anaphase, Telophase.' },
    { text: 'Explain electromagnetic induction and how an electric motor converts electrical energy into mechanical energy.' },
    { text: 'Describe the structural parts of the human heart and trace the complete circulatory path of blood.' },
  ],
};

const MATH_DB: SubjectDB = {
  MCQ: [
    { text: 'If 3x + 7 = 22, what is x?', options: ['3', '5', '7', '15'], correctAnswer: '5' },
    { text: 'A triangle has angles 50° and 60°. What is the third angle?', options: ['70°', '80°', '90°', '100°'], correctAnswer: '70°' },
    { text: 'What is the derivative of f(x) = 3x²?', options: ['3x', '6x', '6x²', '9x'], correctAnswer: '6x' },
    { text: 'What is log₁₀(1000)?', options: ['1', '2', '3', '4'], correctAnswer: '3' },
    { text: 'Area of a circle with radius 7 cm (π ≈ 22/7)?', options: ['44 cm²', '154 cm²', '308 cm²', '616 cm²'], correctAnswer: '154 cm²' },
  ],
  Short: [
    { text: 'Solve the quadratic equation: x² − 5x + 6 = 0.' },
    { text: 'Prove that the sum of angles in a Euclidean triangle equals 180°.' },
    { text: 'Find the limit as x→3 of (x² − 9) / (x − 3).' },
    { text: 'A class has boys to girls ratio 3:5 with 40 students total. How many are girls?' },
  ],
  Long: [
    { text: 'A sphere is inscribed in a cylinder. Prove that the volume ratio is 2:3 and derive the surface area ratio.' },
    { text: 'Using Mathematical Induction, prove that 1 + 2 + ... + n = n(n+1)/2 for all positive integers n.' },
    { text: 'Define Riemann Sums. Explain how definite integrals represent area under a curve. Calculate ∫₁⁴ x² dx.' },
  ],
};

const GENERIC_DB: SubjectDB = {
  MCQ: [
    { text: 'Which is a primary color in the additive light model?', options: ['Yellow', 'Green', 'Orange', 'Purple'], correctAnswer: 'Green' },
    { text: 'Who wrote the play "Hamlet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correctAnswer: 'William Shakespeare' },
    { text: 'In which year did World War II end?', options: ['1918', '1939', '1945', '1950'], correctAnswer: '1945' },
    { text: 'Which country is called the Land of the Rising Sun?', options: ['China', 'Japan', 'South Korea', 'Thailand'], correctAnswer: 'Japan' },
    { text: 'What is the capital of France?', options: ['Rome', 'Berlin', 'Madrid', 'Paris'], correctAnswer: 'Paris' },
  ],
  Short: [
    { text: 'Explain the main cause of the Industrial Revolution and its impact on urban societies.' },
    { text: 'What is the role of the judicial branch in a democratic government?' },
    { text: 'Analyze the significance of ambition as a theme in Shakespeare\'s "Macbeth".' },
    { text: 'Describe the key characteristics of a free-market economy.' },
  ],
  Long: [
    { text: 'Compare the causes, events, and outcomes of World War I and World War II. Analyze their long-term geopolitical effects.' },
    { text: 'Discuss globalization. Detail its economic, cultural, and environmental impacts on both developing and developed nations.' },
    { text: 'Explain the water cycle in detail. How do deforestation and urbanization disrupt it, and what sustainable interventions exist?' },
  ],
};

const SECTION_INSTRUCTIONS: Record<ISectionConfig['type'], string> = {
  MCQ: 'Choose the correct alternative from the options provided. Each question carries equal marks.',
  Short: 'Answer each question in 50–80 words using precise terminology.',
  Long: 'Answer in detail (300–500 words). Include diagrams or mathematical proofs where applicable.',
};

function selectDB(subject: string): SubjectDB {
  const s = subject.toLowerCase();
  if (/science|physics|chem|bio/.test(s)) return SCIENCE_DB;
  if (/math|algebra|geometry|calc|arithmetic/.test(s)) return MATH_DB;
  return GENERIC_DB;
}

function buildFallback(
  title: string,
  subject: string,
  sectionConfigs: ISectionConfig[],
  setName: string = 'A'
): ISection[] {
  const db = selectDB(subject);

  return sectionConfigs.map((cfg) => {
    const pool = db[cfg.type] ?? GENERIC_DB[cfg.type];

    const questions: IQuestion[] = Array.from({ length: cfg.count }, (_, i) => {
      const setOffset = setName.charCodeAt(0) - 65;
      const template = pool[(i + setOffset) % pool.length];
      const question: IQuestion = {
        text: `${template.text} [Topic: ${title}]`,
        difficulty: cfg.difficulty,
        marks: cfg.marksPerQuestion,
      };

      if (cfg.type === 'MCQ' && 'options' in template) {
        question.options = [...template.options];
        question.correctAnswer = template.correctAnswer;
      }

      return question;
    });

    return {
      title: cfg.title,
      instruction: SECTION_INSTRUCTIONS[cfg.type],
      questions,
    };
  });
}

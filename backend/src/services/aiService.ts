import { GoogleGenAI } from '@google/genai';
import { ISection, IQuestion } from '../models/Assignment';

export interface ISectionConfig {
  title: string;
  type: 'MCQ' | 'Short' | 'Long';
  count: number;
  marksPerQuestion: number;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
}

/**
 * Generate structured assignment sections using Gemini AI or a smart fallback engine.
 */
export const generateAssignmentContent = async (
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string = '',
  sectionConfigs: ISectionConfig[]
): Promise<ISection[]> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      console.log('[AI Service] GEMINI_API_KEY detected. Using live Gemini API...');
      return await generateWithGemini(title, subject, grade, additionalInstructions, sectionConfigs, apiKey);
    } catch (error) {
      console.error('[AI Service] Gemini API call failed, falling back to mock generator:', error);
      return generateMockFallback(title, subject, grade, additionalInstructions, sectionConfigs);
    }
  } else {
    console.log('[AI Service] No GEMINI_API_KEY set. Triggering Creative Interactive Fallback Mode...');
    // Introduce a short artificial delay to simulate job execution in workers
    await new Promise((resolve) => setTimeout(resolve, 3000));
    return generateMockFallback(title, subject, grade, additionalInstructions, sectionConfigs);
  }
};

/**
 * Connect to Google Gemini API using structured prompt instructions
 */
async function generateWithGemini(
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string,
  sectionConfigs: ISectionConfig[],
  apiKey: string
): Promise<ISection[]> {
  // Use GoogleGenAI standard client
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an expert academic assessment creator. Create a beautifully structured question paper based on the following specifications:

Title: ${title}
Subject: ${subject}
Grade: ${grade}
Additional Instructions / Reference Material: ${additionalInstructions}

Ensure the questions are intellectually challenging and fit for the specified grade level.
Generate exactly the following sections with their corresponding parameters:
${sectionConfigs
  .map(
    (cfg, idx) =>
      `- Section ${idx + 1}: Title "${cfg.title}", Type "${cfg.type}" (MCQ requires options and correctAnswer), Count ${cfg.count} questions, Marks per question: ${cfg.marksPerQuestion}, Difficulty: "${cfg.difficulty}"`
  )
  .join('\n')}

Format your output strictly as a JSON object matching the JSON Schema:
{
  "sections": [
    {
      "title": "Section Title",
      "instruction": "Section specific instructions",
      "questions": [
        {
          "text": "The text of the question",
          "options": ["Option A", "Option B", "Option C", "Option D"], // Only present if type is MCQ, must have exactly 4 items
          "correctAnswer": "Option A", // Only present if type is MCQ, must be one of the options
          "difficulty": "Easy" | "Moderate" | "Hard",
          "marks": number
        }
      ]
    }
  ]
}

DO NOT include any markdown formatting wrappers (like \`\`\`json) or extra text. Return ONLY the raw JSON string.
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error('Empty response received from Gemini.');
  }

  // Clean the response text in case it wrapped it in markdown codeblocks
  let cleanedJson = responseText.trim();
  if (cleanedJson.startsWith('```json')) {
    cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
  } else if (cleanedJson.startsWith('```')) {
    cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
  }

  const parsed = JSON.parse(cleanedJson);
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid JSON format: missing sections array');
  }

  return parsed.sections as ISection[];
}

/**
 * Creative fallback question generator, matching subjects with deep question templates
 */
function generateMockFallback(
  title: string,
  subject: string,
  grade: string,
  additionalInstructions: string,
  sectionConfigs: ISectionConfig[]
): ISection[] {
  const normSubject = subject.toLowerCase();

  // Curated lists of dynamic questions by category
  const scienceDB = {
    MCQ: [
      { text: 'Which organelle is known as the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correctAnswer: 'Mitochondria' },
      { text: 'What is the chemical symbol for the element Gold?', options: ['Ag', 'Au', 'Fe', 'Gd'], correctAnswer: 'Au' },
      { text: 'Which planet in our solar system is known for its prominent ring system?', options: ['Mars', 'Jupiter', 'Saturn', 'Neptune'], correctAnswer: 'Saturn' },
      { text: 'What is the acceleration due to gravity on Earth?', options: ['9.8 m/s²', '8.9 m/s²', '10.5 m/s²', '7.2 m/s²'], correctAnswer: '9.8 m/s²' },
      { text: 'Which gas is most abundant in the Earth\'s atmosphere?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Argon'], correctAnswer: 'Nitrogen' },
      { text: 'What is the pH level of pure distilled water?', options: ['5.5', '7.0', '8.5', '9.0'], correctAnswer: '7.0' }
    ],
    Short: [
      { text: 'Briefly explain the process of Photosynthesis in plants.' },
      { text: 'State Newton\'s Second Law of Motion and write its mathematical equation.' },
      { text: 'Describe the primary differences between covalent and ionic bonds.' },
      { text: 'What is the greenhouse effect, and how does it impact global temperatures?' },
      { text: 'Explain the difference between renewable and non-renewable energy sources.' }
    ],
    Long: [
      { text: 'Detail the entire process of Mitosis, illustrating the differences between each phase (Prophase, Metaphase, Anaphase, Telophase).' },
      { text: 'Explain the principles of electromagnetism. Discuss how an electric motor converts electrical energy into mechanical energy.' },
      { text: 'Describe the structural parts of a human heart and trace the flow of oxygenated and deoxygenated blood through the circulatory system.' }
    ]
  };

  const mathDB = {
    MCQ: [
      { text: 'What is the value of x if 3x + 7 = 22?', options: ['3', '5', '7', '15'], correctAnswer: '5' },
      { text: 'If a triangle has angles measuring 50° and 60°, what is the measure of the third angle?', options: ['70°', '80°', '90°', '100°'], correctAnswer: '70°' },
      { text: 'What is the derivative of f(x) = 3x² with respect to x?', options: ['3x', '6x', '6x²', '9x'], correctAnswer: '6x' },
      { text: 'What is the value of log₁₀(1000)?', options: ['1', '2', '3', '4'], correctAnswer: '3' },
      { text: 'Find the area of a circle with a radius of 7 cm (Take π ≈ 22/7).', options: ['44 cm²', '154 cm²', '308 cm²', '616 cm²'], correctAnswer: '154 cm²' }
    ],
    Short: [
      { text: 'Solve the quadratic equation: x² - 5x + 6 = 0.' },
      { text: 'Prove that the sum of angles in any Euclidean triangle is always 180 degrees.' },
      { text: 'Find the limit as x approaches 3 of (x² - 9) / (x - 3).' },
      { text: 'The ratio of boys to girls in a class is 3:5. If there are 40 students, how many are girls?' }
    ],
    Long: [
      { text: 'A sphere is inscribed inside a cylinder such that the sphere touches the top, bottom, and lateral surfaces of the cylinder. Prove that the ratio of the volume of the sphere to the volume of the cylinder is 2:3, and find the ratio of their surface areas.' },
      { text: 'Using the principle of Mathematical Induction, prove that for all positive integers n, 1 + 2 + 3 + ... + n = n(n+1)/2.' },
      { text: 'Define the concept of Riemann Sums. Explain how the definite integral represent the area under a curve, and calculate the integral of y = x² from x = 1 to x = 4.' }
    ]
  };

  const genericDB = {
    MCQ: [
      { text: 'Which of the following is considered a primary color in the additive light mixing model?', options: ['Yellow', 'Green', 'Orange', 'Purple'], correctAnswer: 'Green' },
      { text: 'Who is the author of the famous play "Hamlet"?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correctAnswer: 'William Shakespeare' },
      { text: 'In which year did World War II officially end?', options: ['1918', '1939', '1945', '1950'], correctAnswer: '1945' },
      { text: 'Which country is known as the Land of the Rising Sun?', options: ['China', 'Japan', 'South Korea', 'Thailand'], correctAnswer: 'Japan' },
      { text: 'What is the capital city of France?', options: ['Rome', 'Berlin', 'Madrid', 'Paris'], correctAnswer: 'Paris' }
    ],
    Short: [
      { text: 'Explain the main cause of the Industrial Revolution and its immediate impact on urban societies.' },
      { text: 'What is the role of the judicial branch in a democratic government system?' },
      { text: 'Analyze the significance of the theme of ambition in Shakespeare\'s "Macbeth".' },
      { text: 'Describe the main characteristics of a free-market economic system.' }
    ],
    Long: [
      { text: 'Compare and contrast the causes, courses, and ultimate outcomes of the First and Second World Wars. Analyze their long-term effects on global geopolitics.' },
      { text: 'Discuss the concept of globalization. Detail its economic, cultural, and environmental impacts on both developing and developed countries over the last century.' },
      { text: 'Explain the water cycle in detail. Outline how deforestation and urbanization disrupt this cycle, and propose sustainable actions to combat these disruptions.' }
    ]
  };

  // Choose dictionary based on subject match
  let db = genericDB;
  if (normSubject.includes('science') || normSubject.includes('physics') || normSubject.includes('chem') || normSubject.includes('biol')) {
    db = scienceDB;
  } else if (normSubject.includes('math') || normSubject.includes('algebra') || normSubject.includes('geometry') || normSubject.includes('calc') || normSubject.includes('arithmetic')) {
    db = mathDB;
  }

  // Populate sections using the configs
  const sections: ISection[] = sectionConfigs.map((cfg) => {
    const list: IQuestion[] = [];
    const pool = db[cfg.type] || genericDB[cfg.type];

    for (let i = 0; i < cfg.count; i++) {
      // Pick question from pool (loop around if count exceeds pool size)
      const template = pool[i % pool.length];
      
      const question: IQuestion = {
        text: `${template.text} [Topic: ${title}]`,
        difficulty: cfg.difficulty,
        marks: cfg.marksPerQuestion,
      };

      if (cfg.type === 'MCQ' && 'options' in template) {
        question.options = [...(template.options || [])];
        question.correctAnswer = template.correctAnswer;
      }

      list.push(question);
    }

    const defaultInstructions = {
      MCQ: 'Choose the correct alternative from the choices provided. Each question carries equal marks.',
      Short: 'Answer each question in about 50-80 words. Support your explanation with key terms.',
      Long: 'Answer all descriptive questions in detail (300-500 words). Include labeled diagrams or math proofs where applicable.'
    };

    return {
      title: cfg.title,
      instruction: defaultInstructions[cfg.type] || 'Answer all questions in this section.',
      questions: list
    };
  });

  return sections;
}

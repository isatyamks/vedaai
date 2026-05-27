import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Assignment from '../models/Assignment';
import Syllabus from '../models/Syllabus';
import { assessmentQueue, redisAvailable } from '../config/queue';
import { processGenerationJob } from '../workers/generationWorker';
import { generateAssignmentPDF } from '../services/pdfService';
import { cacheGet, cacheSet, cacheDelete, CK, getCacheTTL, getCacheStats } from '../services/cacheService';

const router = Router();
const TTL = getCacheTTL();

const SectionSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['MCQ', 'Short', 'Long']),
  count: z.number().int().positive(),
  marksPerQuestion: z.number().positive(),
  difficulty: z.enum(['Easy', 'Moderate', 'Hard']),
});

const CreateSchema = z.object({
  title: z.string().min(1).trim(),
  subject: z.string().min(1).trim(),
  grade: z.string().min(1).trim(),
  dueDate: z.string().min(1),
  additionalInstructions: z.string().optional().default(''),
  sections: z.array(SectionSchema).min(1),
  setCount: z.number().int().min(1).max(4).optional().default(1),
  chapters: z.array(z.string()).optional().default([]),
});

async function enqueue(id: string, configs: any[], prompt?: string): Promise<void> {
  await processGenerationJob(id, configs, prompt);
}

const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

router.get('/cache/stats', (_req, res) => res.json({ ...getCacheStats(), redisAvailable }));

router.get('/syllabus/grades', wrap(async (_req, res) => {
  const key = `syllabus:grades`;
  const cached = await cacheGet<string[]>(key);
  if (cached) return res.json({ grades: cached });
  const grades = await Syllabus.distinct('gradeClass');
  const sorted = grades.sort((a, b) => {
    const numA = parseInt(a.replace(/[^\d]/g, '')) || 0;
    const numB = parseInt(b.replace(/[^\d]/g, '')) || 0;
    return numA - numB;
  });
  await cacheSet(key, sorted, 3600);
  return res.json({ grades: sorted });
}));

router.get('/syllabus/subjects', wrap(async (req, res) => {
  const { grade } = req.query;
  if (!grade) return res.status(400).json({ error: 'grade is required.' });
  const key = `syllabus:subjects:${grade}`;
  const cached = await cacheGet<string[]>(key);
  if (cached) return res.json({ subjects: cached });
  const subjects = await Syllabus.find({ gradeClass: String(grade).trim() }).distinct('subjectName');
  const sorted = subjects.sort();
  await cacheSet(key, sorted, 3600);
  return res.json({ subjects: sorted });
}));

router.get('/syllabus/chapters', wrap(async (req, res) => {
  const { grade, subject } = req.query;
  if (!grade || !subject) return res.status(400).json({ error: 'grade and subject are required.' });
  const key = `syllabus:chapters:${grade}:${subject}`;
  const cached = await cacheGet<string[]>(key);
  if (cached) return res.json({ chapters: cached });
  const doc = await Syllabus.findOne({ gradeClass: String(grade).trim(), subjectName: String(subject).trim() });
  const chapters = doc?.chapterList ?? [];
  await cacheSet(key, chapters, 3600);
  return res.json({ chapters });
}));

router.post('/seed', wrap(async (_req, res) => {
  const seedConfigs = [
    {
      title: 'Mathematics Assessment — Grade 8',
      subject: 'Mathematics',
      grade: 'Grade 8',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      additionalInstructions: 'Answer all questions clearly. Show your working where appropriate.',
      setCount: 1,
      chapters: [],
      sections: [
        { title: 'Section A: Multiple Choice Questions', type: 'MCQ' as const, count: 4, marksPerQuestion: 1, difficulty: 'Moderate' as const },
        { title: 'Section B: Short Questions', type: 'Short' as const, count: 4, marksPerQuestion: 4, difficulty: 'Moderate' as const }
      ]
    },
    {
      title: 'Physics & Chemistry Assessment — Grade 10',
      subject: 'Science',
      grade: 'Grade 10',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      additionalInstructions: 'Scientific calculators are allowed. Show all equations and calculations.',
      setCount: 1,
      chapters: [],
      sections: [
        { title: 'Section A: Multiple Choice Questions', type: 'MCQ' as const, count: 5, marksPerQuestion: 1, difficulty: 'Easy' as const },
        { title: 'Section B: Short Answer Questions', type: 'Short' as const, count: 3, marksPerQuestion: 3, difficulty: 'Moderate' as const },
        { title: 'Section C: Long Answer Questions', type: 'Long' as const, count: 2, marksPerQuestion: 5, difficulty: 'Hard' as const }
      ]
    },
    {
      title: 'English Grammar and Comprehension — Grade 6',
      subject: 'English',
      grade: 'Grade 6',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      additionalInstructions: 'Read the passages carefully. Write in complete sentences.',
      setCount: 1,
      chapters: [],
      sections: [
        { title: 'Section A: Multiple Choice Questions', type: 'MCQ' as const, count: 6, marksPerQuestion: 1, difficulty: 'Easy' as const },
        { title: 'Section B: Short Questions', type: 'Short' as const, count: 4, marksPerQuestion: 3, difficulty: 'Moderate' as const }
      ]
    },
    {
      title: 'World War I History Assessment — Grade 9',
      subject: 'History',
      grade: 'Grade 9',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      additionalInstructions: 'Provide historical evidence and references where applicable.',
      setCount: 1,
      chapters: [],
      sections: [
        { title: 'Section A: Multiple Choice Questions', type: 'MCQ' as const, count: 5, marksPerQuestion: 1, difficulty: 'Moderate' as const },
        { title: 'Section B: Short Answer Questions', type: 'Short' as const, count: 3, marksPerQuestion: 4, difficulty: 'Moderate' as const },
        { title: 'Section C: Essay Question', type: 'Long' as const, count: 1, marksPerQuestion: 8, difficulty: 'Hard' as const }
      ]
    }
  ];

  const created = [];
  for (const item of seedConfigs) {
    const assignment = await Assignment.create({
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      dueDate: item.dueDate,
      additionalInstructions: item.additionalInstructions,
      status: 'queued',
      progress: 0,
      sections: [],
      sets: [],
      setCount: item.setCount,
      chapters: item.chapters
    });
    await enqueue(assignment._id.toString(), item.sections);
    created.push(assignment);
  }

  await cacheDelete(CK.list);
  return res.status(201).json({ message: 'Seeding initiated. Assessments are being generated in the background.', created });
}));

router.get('/', wrap(async (_req, res) => {
  const cached = await cacheGet<any[]>(CK.list);
  if (cached) return res.json(cached);
  const data = await Assignment.find().sort({ createdAt: -1 }).lean();
  await cacheSet(CK.list, data, TTL.list);
  return res.json(data);
}));

router.get('/:id', wrap(async (req, res) => {
  const key = CK.detail(req.params.id);
  const cached = await cacheGet<any>(key);
  if (cached) return res.json(cached);
  const doc = await Assignment.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ error: 'Assignment not found.' });
  if (doc.status === 'completed' || doc.status === 'failed') await cacheSet(key, doc, TTL.detail);
  return res.json(doc);
}));

router.post('/', wrap(async (req, res) => {
  const result = CreateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors[0]?.message });
  const { title, subject, grade, dueDate, additionalInstructions, sections, setCount, chapters } = result.data;
  const assignment = await Assignment.create({
    title, subject, grade,
    dueDate: new Date(dueDate),
    additionalInstructions,
    status: 'queued', progress: 0,
    sections: [], sets: [],
    setCount, chapters,
  });
  await cacheDelete(CK.list);
  await enqueue(assignment._id.toString(), sections);
  const updatedAssignment = await Assignment.findById(assignment._id);
  return res.status(201).json(updatedAssignment);
}));

router.post('/:id/regenerate', wrap(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  const configs = req.body.sections?.length
    ? req.body.sections
    : assignment.sections.map((sec) => {
        const q = sec.questions[0];
        return {
          title: sec.title,
          type: q?.options?.length ? 'MCQ' : (q?.marks ?? 0) > 6 ? 'Long' : 'Short',
          count: sec.questions.length,
          marksPerQuestion: q?.marks ?? 5,
          difficulty: q?.difficulty ?? 'Moderate',
        };
      });
  if (!configs.length) return res.status(400).json({ error: 'No section configs available.' });
  assignment.status = 'queued';
  assignment.progress = 0;
  assignment.sections = [];
  assignment.sets = [];
  assignment.errorMessage = undefined;
  await assignment.save();
  await cacheDelete(CK.detail(req.params.id));
  await cacheDelete(CK.list);
  await enqueue(req.params.id, configs);
  const updatedAssignment = await Assignment.findById(req.params.id);
  return res.json(updatedAssignment);
}));

router.post('/:id/edit', wrap(async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required for AI editing.' });
  
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  const configs = assignment.sections.map((sec) => {
    const q = sec.questions[0];
    return {
      title: sec.title,
      type: q?.options?.length ? 'MCQ' : (q?.marks ?? 0) > 6 ? 'Long' : 'Short',
      count: sec.questions.length,
      marksPerQuestion: q?.marks ?? 5,
      difficulty: q?.difficulty ?? 'Moderate',
    };
  });

  if (!configs.length) return res.status(400).json({ error: 'No section configs available.' });

  assignment.status = 'queued';
  assignment.progress = 0;
  assignment.sections = [];
  assignment.sets = [];
  assignment.errorMessage = undefined;
  await assignment.save();

  await cacheDelete(CK.detail(req.params.id));
  await cacheDelete(CK.list);

  await enqueue(req.params.id, configs, prompt);
  const updatedAssignment = await Assignment.findById(req.params.id);
  return res.json(updatedAssignment);
}));

router.get('/:id/pdf', wrap(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  if (assignment.status !== 'completed') return res.status(400).json({ error: 'PDF only available for completed assessments.' });
  return generateAssignmentPDF(assignment, res, req.query.set as string);
}));

export default router;

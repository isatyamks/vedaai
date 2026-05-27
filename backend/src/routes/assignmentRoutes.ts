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

async function enqueue(id: string, configs: any[]): Promise<void> {
  if (process.env.VERCEL) {
    await processGenerationJob(id, configs);
  } else if (redisAvailable && assessmentQueue) {
    await assessmentQueue.add('generate-questions', { assignmentId: id, sectionConfigs: configs });
  } else {
    setImmediate(() => processGenerationJob(id, configs));
  }
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
  return res.status(201).json(assignment);
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
  return res.json(assignment);
}));

router.get('/:id/pdf', wrap(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
  if (assignment.status !== 'completed') return res.status(400).json({ error: 'PDF only available for completed assessments.' });
  return generateAssignmentPDF(assignment, res, req.query.set as string);
}));

export default router;

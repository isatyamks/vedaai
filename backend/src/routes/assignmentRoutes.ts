import { Router, Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { assessmentQueue, redisAvailable } from '../config/queue';
import { processGenerationJob } from '../workers/generationWorker';
import { generateAssignmentPDF } from '../services/pdfService';
import {
  cacheGet,
  cacheSet,
  cacheDelete,
  CK,
  getCacheTTL,
  getCacheStats,
} from '../services/cacheService';

const router = Router();
const TTL = getCacheTTL();

const VALID_TYPES = ['MCQ', 'Short', 'Long'] as const;
const VALID_DIFFICULTIES = ['Easy', 'Moderate', 'Hard'] as const;

function validateSections(sections: any[]): string | null {
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (!s.title?.trim()) return `Section ${i + 1} is missing a title.`;
    if (!VALID_TYPES.includes(s.type)) return `Section ${i + 1} has an invalid type.`;
    if (!s.count || s.count <= 0) return `Section ${i + 1} must have a positive question count.`;
    if (!s.marksPerQuestion || s.marksPerQuestion <= 0) return `Section ${i + 1} must have positive marks per question.`;
    if (!VALID_DIFFICULTIES.includes(s.difficulty)) return `Section ${i + 1} has an invalid difficulty.`;
  }
  return null;
}

async function enqueueOrProcess(assignmentId: string, sectionConfigs: any[]): Promise<void> {
  if (redisAvailable && assessmentQueue) {
    await assessmentQueue.add('generate-questions', { assignmentId, sectionConfigs });
  } else {
    setImmediate(() => processGenerationJob(assignmentId, sectionConfigs));
  }
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = await cacheGet<any[]>(CK.list);
    if (cached) return res.json(cached);

    const assignments = await Assignment.find().sort({ createdAt: -1 });
    await cacheSet(CK.list, assignments, TTL.list);
    return res.json(assignments);
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

router.get('/cache/stats', (_req: Request, res: Response) => {
  res.json({ ...getCacheStats(), redisAvailable });
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cacheKey = CK.detail(id);

    const cached = await cacheGet<any>(cacheKey);
    if (cached) return res.json(cached);

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    if (assignment.status === 'completed' || assignment.status === 'failed') {
      await cacheSet(cacheKey, assignment, TTL.detail);
    }

    return res.json(assignment);
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve assignment.' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, additionalInstructions, sections } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Assignment title is required.' });
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject area is required.' });
    if (!grade?.trim()) return res.status(400).json({ error: 'Grade is required.' });
    if (!dueDate) return res.status(400).json({ error: 'Due date is required.' });
    if (!Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'At least one section must be configured.' });
    }

    const sectionError = validateSections(sections);
    if (sectionError) return res.status(400).json({ error: sectionError });

    const assignment = await Assignment.create({
      title,
      subject,
      grade,
      dueDate: new Date(dueDate),
      additionalInstructions: additionalInstructions ?? '',
      status: 'queued',
      progress: 0,
      sections: [],
    });

    await cacheDelete(CK.list);
    await enqueueOrProcess(assignment._id.toString(), sections);

    return res.status(201).json(assignment);
  } catch {
    return res.status(500).json({ error: 'Failed to create assignment.' });
  }
});

router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    const configsToUse = sections?.length
      ? sections
      : assignment.sections.map((sec) => {
          const firstQ = sec.questions[0];
          return {
            title: sec.title,
            type: firstQ?.options?.length ? 'MCQ' : (firstQ?.marks ?? 0) > 6 ? 'Long' : 'Short',
            count: sec.questions.length,
            marksPerQuestion: firstQ?.marks ?? 5,
            difficulty: firstQ?.difficulty ?? 'Moderate',
          };
        });

    if (configsToUse.length === 0) {
      return res.status(400).json({ error: 'No section configs available for regeneration.' });
    }

    assignment.status = 'queued';
    assignment.progress = 0;
    assignment.sections = [];
    assignment.errorMessage = undefined;
    await assignment.save();

    await cacheDelete(CK.detail(id));
    await cacheDelete(CK.list);
    await enqueueOrProcess(id, configsToUse);

    return res.json(assignment);
  } catch {
    return res.status(500).json({ error: 'Failed to trigger regeneration.' });
  }
});

router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
    if (assignment.status !== 'completed') {
      return res.status(400).json({ error: 'PDF is only available for completed assessments.' });
    }
    return generateAssignmentPDF(assignment, res);
  } catch {
    return res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

export default router;

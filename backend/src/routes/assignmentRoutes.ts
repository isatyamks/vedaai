import { Router, Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { assessmentQueue, redisAvailable } from '../config/queue';
import { processGenerationJob } from '../workers/generationWorker';
import { generateAssignmentPDF } from '../services/pdfService';

const router = Router();

/**
 * GET /api/assignments
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    return res.status(200).json(assignments);
  } catch (error: any) {
    console.error('[Routes] Error listing assignments:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignments.' });
  }
});

/**
 * GET /api/assignments/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
    return res.status(200).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error finding assignment:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignment details.' });
  }
});

/**
 * POST /api/assignments
 * Creates an assignment and either queues or synchronously processes the generation job.
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, additionalInstructions, sections } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!title?.trim()) return res.status(400).json({ error: 'Assignment title is required.' });
    if (!subject?.trim()) return res.status(400).json({ error: 'Subject area is required.' });
    if (!grade?.trim()) return res.status(400).json({ error: 'Grade is required.' });
    if (!dueDate) return res.status(400).json({ error: 'Due date is required.' });
    if (!sections?.length) return res.status(400).json({ error: 'At least one question section must be configured.' });

    for (let i = 0; i < sections.length; i++) {
      const s = sections[i];
      if (!s.title?.trim()) return res.status(400).json({ error: `Section ${i + 1} is missing a title.` });
      if (!['MCQ', 'Short', 'Long'].includes(s.type)) return res.status(400).json({ error: `Section ${i + 1} has invalid type.` });
      if (!s.count || s.count <= 0) return res.status(400).json({ error: `Section ${i + 1} must have a positive question count.` });
      if (!s.marksPerQuestion || s.marksPerQuestion <= 0) return res.status(400).json({ error: `Section ${i + 1} must have positive marks.` });
      if (!['Easy', 'Moderate', 'Hard'].includes(s.difficulty)) return res.status(400).json({ error: `Section ${i + 1} has invalid difficulty.` });
    }

    // ── Save placeholder ─────────────────────────────────────────────────────
    const assignment = new Assignment({
      title,
      subject,
      grade,
      dueDate: new Date(dueDate),
      additionalInstructions: additionalInstructions || '',
      status: 'queued',
      progress: 0,
      sections: [],
    });
    await assignment.save();
    const assignmentId = assignment._id.toString();

    // ── Queue or process synchronously ────────────────────────────────────────
    if (redisAvailable && assessmentQueue) {
      console.log(`[Routes] Queueing job (Redis mode) for assignment: ${assignmentId}`);
      await assessmentQueue.add('generate-questions', { assignmentId, sectionConfigs: sections });
    } else {
      console.log(`[Routes] Processing job SYNCHRONOUSLY (no Redis) for assignment: ${assignmentId}`);
      // Run in background without blocking the HTTP response
      setImmediate(() => processGenerationJob(assignmentId, sections));
    }

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error creating assignment:', error);
    return res.status(500).json({ error: 'Failed to create and queue assignment.' });
  }
});

/**
 * POST /api/assignments/:id/regenerate
 */
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

    let configsToUse = sections;
    if (!configsToUse?.length) {
      configsToUse = assignment.sections.map((sec) => {
        const firstQ = sec.questions[0];
        return {
          title: sec.title,
          type: firstQ?.options?.length ? 'MCQ' : firstQ?.marks > 6 ? 'Long' : 'Short',
          count: sec.questions.length,
          marksPerQuestion: firstQ?.marks || 5,
          difficulty: firstQ?.difficulty || 'Moderate',
        };
      });
    }

    if (!configsToUse.length) return res.status(400).json({ error: 'No section configs available to regenerate.' });

    assignment.status = 'queued';
    assignment.progress = 0;
    assignment.sections = [];
    assignment.errorMessage = undefined;
    await assignment.save();

    const assignmentId = id;

    if (redisAvailable && assessmentQueue) {
      await assessmentQueue.add('generate-questions', { assignmentId, sectionConfigs: configsToUse });
    } else {
      setImmediate(() => processGenerationJob(assignmentId, configsToUse));
    }

    return res.status(200).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error regenerating assignment:', error);
    return res.status(500).json({ error: 'Failed to trigger regeneration.' });
  }
});

/**
 * GET /api/assignments/:id/pdf
 */
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });
    if (assignment.status !== 'completed') return res.status(400).json({ error: 'PDF can only be generated for completed assessments.' });
    return generateAssignmentPDF(assignment, res);
  } catch (error: any) {
    console.error('[Routes] Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF.' });
  }
});

export default router;

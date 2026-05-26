import { Router, Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { assessmentQueue } from '../config/queue';
import { generateAssignmentPDF } from '../services/pdfService';

const router = Router();

/**
 * GET /api/assignments
 * Retrieve all assignments, sorted newest first
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
 * Retrieve a specific assignment
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }
    return res.status(200).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error finding assignment:', error);
    return res.status(500).json({ error: 'Failed to retrieve assignment details.' });
  }
});

/**
 * POST /api/assignments
 * Create an assignment and queue AI question generation
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, subject, grade, dueDate, additionalInstructions, sections } = req.body;

    // 1. Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Assignment title is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject area is required.' });
    }
    if (!grade || !grade.trim()) {
      return res.status(400).json({ error: 'Grade or class grade is required.' });
    }
    if (!dueDate) {
      return res.status(400).json({ error: 'Due date is required.' });
    }

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'At least one question section must be configured.' });
    }

    // Deep Validation on section parameters to avoid bad jobs
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (!section.title || !section.title.trim()) {
        return res.status(400).json({ error: `Section ${i + 1} is missing a title.` });
      }
      if (!['MCQ', 'Short', 'Long'].includes(section.type)) {
        return res.status(400).json({ error: `Section ${i + 1} has invalid type: ${section.type}` });
      }
      if (!section.count || section.count <= 0 || !Number.isInteger(section.count)) {
        return res.status(400).json({ error: `Section ${i + 1} must specify a positive integer question count.` });
      }
      if (!section.marksPerQuestion || section.marksPerQuestion <= 0) {
        return res.status(400).json({ error: `Section ${i + 1} must specify positive marks per question.` });
      }
      if (!['Easy', 'Moderate', 'Hard'].includes(section.difficulty)) {
        return res.status(400).json({ error: `Section ${i + 1} difficulty must be Easy, Moderate, or Hard.` });
      }
    }

    // 2. Write placeholder Assignment to DB in "queued" status
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

    // 3. Queue the background parsing job via BullMQ
    console.log(`[Routes] Queueing job for assignment: ${assignment._id}`);
    await assessmentQueue.add('generate-questions', {
      assignmentId: assignment._id.toString(),
      sectionConfigs: sections,
    });

    return res.status(201).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error creating assignment:', error);
    return res.status(500).json({ error: 'Failed to create and queue assignment.' });
  }
});

/**
 * POST /api/assignments/:id/regenerate
 * Re-queue question paper generation for a pre-existing assignment
 */
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body; // Allows updated configurations if necessary

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    let configsToUse = sections;
    if (!configsToUse || !Array.isArray(configsToUse) || configsToUse.length === 0) {
      // Reconstruct configs from existing sections if new configs aren't supplied
      configsToUse = assignment.sections.map((sec) => {
        const firstQ = sec.questions[0];
        return {
          title: sec.title,
          type: firstQ?.options && firstQ.options.length > 0 ? 'MCQ' : sec.questions[0]?.marks > 6 ? 'Long' : 'Short',
          count: sec.questions.length,
          marksPerQuestion: firstQ?.marks || 5,
          difficulty: firstQ?.difficulty || 'Moderate',
        };
      });
    }

    if (configsToUse.length === 0) {
      return res.status(400).json({ error: 'No section configurations available to regenerate questions.' });
    }

    // Reset status back to queued and clear sections
    assignment.status = 'queued';
    assignment.progress = 0;
    assignment.sections = [];
    assignment.errorMessage = undefined;
    await assignment.save();

    // Push back to BullMQ
    console.log(`[Routes] Re-queueing job for assignment: ${assignment._id}`);
    await assessmentQueue.add('generate-questions', {
      assignmentId: assignment._id.toString(),
      sectionConfigs: configsToUse,
    });

    return res.status(200).json(assignment);
  } catch (error: any) {
    console.error('[Routes] Error regenerating assignment:', error);
    return res.status(500).json({ error: 'Failed to trigger assignment regeneration.' });
  }
});

/**
 * GET /api/assignments/:id/pdf
 * Export and stream the structured assignment PDF
 */
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    if (assignment.status !== 'completed') {
      return res.status(400).json({ error: 'PDF can only be generated for fully completed assessments.' });
    }

    return generateAssignmentPDF(assignment, res);
  } catch (error: any) {
    console.error('[Routes] Error exporting assignment PDF:', error);
    return res.status(500).json({ error: 'Failed to generate and stream PDF document.' });
  }
});

export default router;

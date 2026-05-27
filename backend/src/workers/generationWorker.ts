import { Worker, Job } from 'bullmq';
import { redisConnection, redisAvailable } from '../config/queue';
import Assignment from '../models/Assignment';
import { generateAssignmentContent, ISectionConfig } from '../services/aiService';
import { emitAssignmentProgress } from '../services/socketService';

type AssignmentStatus = 'queued' | 'processing' | 'completed' | 'failed';

async function updateProgress(
  assignmentId: string,
  status: AssignmentStatus,
  progress: number,
  message: string
): Promise<void> {
  await Assignment.findByIdAndUpdate(assignmentId, { status, progress });
  emitAssignmentProgress(assignmentId, status, progress, message);
}

export async function processGenerationJob(
  assignmentId: string,
  sectionConfigs: ISectionConfig[]
): Promise<void> {
  try {
    await updateProgress(assignmentId, 'processing', 15, 'Preparing your test paper...');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    await updateProgress(assignmentId, 'processing', 30, 'Setting up sections and structure...');

    const count = assignment.setCount || 1;
    const sets = [];

    for (let setIdx = 0; setIdx < count; setIdx++) {
      const setName = String.fromCharCode(65 + setIdx);
      const startProg = 30 + Math.floor((setIdx / count) * 55);
      
      await updateProgress(
        assignmentId,
        'processing',
        startProg,
        `Writing questions for Set ${setName}...`
      );

      const sections = await generateAssignmentContent(
        assignment.title,
        assignment.subject,
        assignment.grade,
        assignment.additionalInstructions ?? '',
        sectionConfigs,
        setName,
        assignment.chapters ?? []
      );

      sets.push({ setName, sections });
    }

    await updateProgress(assignmentId, 'processing', 95, 'Saving questions and finalizing paper...');

    assignment.sets = sets;
    assignment.sections = sets[0]?.sections ?? [];
    assignment.status = 'completed';
    assignment.progress = 100;
    await assignment.save();

    emitAssignmentProgress(assignmentId, 'completed', 100, 'Test paper created successfully!');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown processing error.';
    await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed', progress: 100, errorMessage: message });
    emitAssignmentProgress(assignmentId, 'failed', 100, message);
  }
}

export function initWorker(): void {
  if (!redisAvailable || !redisConnection) return;

  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId, sectionConfigs } = job.data;
      await processGenerationJob(assignmentId, sectionConfigs);
    },
    { connection: redisConnection as any }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });
}

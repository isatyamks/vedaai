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
    await updateProgress(assignmentId, 'processing', 15, 'Starting generation worker...');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error(`Assignment ${assignmentId} not found.`);

    await updateProgress(assignmentId, 'processing', 40, 'Structuring prompts and analyzing section config...');
    await updateProgress(assignmentId, 'processing', 70, 'Querying AI model for structured output...');

    const sections = await generateAssignmentContent(
      assignment.title,
      assignment.subject,
      assignment.grade,
      assignment.additionalInstructions ?? '',
      sectionConfigs
    );

    await updateProgress(assignmentId, 'processing', 90, 'Persisting questions to database...');

    assignment.sections = sections;
    assignment.status = 'completed';
    assignment.progress = 100;
    await assignment.save();

    emitAssignmentProgress(assignmentId, 'completed', 100, 'Assessment created successfully!');
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

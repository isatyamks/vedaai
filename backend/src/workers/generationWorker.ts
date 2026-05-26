import { Worker, Job } from 'bullmq';
import { redisConnection, redisAvailable } from '../config/queue';
import Assignment from '../models/Assignment';
import { generateAssignmentContent, ISectionConfig } from '../services/aiService';
import { emitAssignmentProgress } from '../services/socketService';

/**
 * Core job processor — shared between the BullMQ worker and the sync fallback.
 */
export const processGenerationJob = async (assignmentId: string, sectionConfigs: ISectionConfig[]) => {
  console.log(`[Worker] Started processing assignment: ${assignmentId}`);

  try {
    await updateState(assignmentId, 'processing', 15, 'Starting background job worker...');

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found in database.');

    await updateState(assignmentId, 'processing', 40, 'Structuring prompts and analyzing input configs...');
    await updateState(assignmentId, 'processing', 70, 'Querying AI model for structured question formatting...');

    const generatedSections = await generateAssignmentContent(
      assignment.title,
      assignment.subject,
      assignment.grade,
      assignment.additionalInstructions,
      sectionConfigs
    );

    await updateState(assignmentId, 'processing', 90, 'Writing questions to database...');
    assignment.sections = generatedSections;
    assignment.status = 'completed';
    assignment.progress = 100;
    await assignment.save();

    emitAssignmentProgress(assignmentId, 'completed', 100, 'Assessment created successfully!');
    console.log(`[Worker] ✅ Completed assignment: ${assignmentId}`);
  } catch (error: any) {
    console.error(`[Worker] ❌ Error processing assignment ${assignmentId}:`, error);
    try {
      await Assignment.findByIdAndUpdate(assignmentId, {
        status: 'failed',
        progress: 100,
        errorMessage: error.message || 'Unknown processing error.',
      });
      emitAssignmentProgress(assignmentId, 'failed', 100, error.message || 'Processing failed.');
    } catch (dbError) {
      console.error('[Worker] Fatal error writing failure to DB:', dbError);
    }
  }
};

/**
 * Initialise the BullMQ worker only when Redis is available.
 * When Redis is not available this function is a no-op — routes handle sync fallback.
 */
export const initWorker = () => {
  if (!redisAvailable || !redisConnection) {
    console.log('[Worker] Redis unavailable — BullMQ worker skipped. Jobs will run synchronously.');
    return;
  }

  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId, sectionConfigs } = job.data;
      await processGenerationJob(assignmentId, sectionConfigs);
    },
    { connection: redisConnection }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  console.log('[Worker] ✅ BullMQ worker listening for jobs.');
};

async function updateState(
  assignmentId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  message: string
) {
  await Assignment.findByIdAndUpdate(assignmentId, { status, progress });
  emitAssignmentProgress(assignmentId, status, progress, message);
}

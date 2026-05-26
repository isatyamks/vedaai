import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/queue';
import Assignment from '../models/Assignment';
import { generateAssignmentContent, ISectionConfig } from '../services/aiService';
import { emitAssignmentProgress } from '../services/socketService';

export const initWorker = () => {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId, sectionConfigs } = job.data;
      console.log(`[Worker] Started processing assignment: ${assignmentId}`);

      try {
        // Step 1: Initialize
        await updateState(assignmentId, 'processing', 15, 'Starting background job worker...');

        // Step 2: Fetch details from Mongo
        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) {
          throw new Error('Assignment not found in database.');
        }

        // Step 3: Prompt structuring
        await updateState(assignmentId, 'processing', 40, 'Structuring prompts and analyzing input configs...');

        // Step 4: AI Generation
        await updateState(assignmentId, 'processing', 70, 'Querying AI model for structured question formatting...');
        const generatedSections = await generateAssignmentContent(
          assignment.title,
          assignment.subject,
          assignment.grade,
          assignment.additionalInstructions,
          sectionConfigs as ISectionConfig[]
        );

        // Step 5: Save
        await updateState(assignmentId, 'processing', 90, 'Writing questions and difficulty badges to database...');
        assignment.sections = generatedSections;
        assignment.status = 'completed';
        assignment.progress = 100;
        await assignment.save();

        // Step 6: Complete
        emitAssignmentProgress(assignmentId, 'completed', 100, 'Assessment created successfully!');
        console.log(`[Worker] Successfully completed assignment: ${assignmentId}`);
      } catch (error: any) {
        console.error(`[Worker] Error processing assignment ${assignmentId}:`, error);
        
        // Update DB with Failure details
        try {
          await Assignment.findByIdAndUpdate(assignmentId, {
            status: 'failed',
            progress: 100,
            errorMessage: error.message || 'Unknown processing error occurred.',
          });
          emitAssignmentProgress(assignmentId, 'failed', 100, error.message || 'Processing failed.');
        } catch (dbError) {
          console.error('[Worker] Fatal error writing failure log to database:', dbError);
        }
      }
    },
    { connection: redisConnection }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed globally:`, err);
  });

  console.log('[Worker] BullMQ Background Worker successfully initialized and listening for jobs.');
};

/**
 * Utility function to update assignment state in database and emit progress
 */
async function updateState(
  assignmentId: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  message: string
) {
  await Assignment.findByIdAndUpdate(assignmentId, { status, progress });
  emitAssignmentProgress(assignmentId, status, progress, message);
}

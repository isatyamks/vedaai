import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import Assignment from '../models/Assignment';
import { processGenerationJob } from '../workers/generationWorker';

const SEED_ASSIGNMENTS = [
  {
    title: 'Mathematics Assessment — Grade 8',
    subject: 'Mathematics',
    grade: 'Grade 8',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    additionalInstructions: 'Answer all questions clearly. Show your working where appropriate.',
    setCount: 1,
    chapters: [],
    sections: [
      {
        title: 'Section A: Multiple Choice Questions',
        type: 'MCQ' as const,
        count: 4,
        marksPerQuestion: 1,
        difficulty: 'Moderate' as const,
      },
      {
        title: 'Section B: Short Questions',
        type: 'Short' as const,
        count: 4,
        marksPerQuestion: 4,
        difficulty: 'Moderate' as const,
      },
    ],
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
      {
        title: 'Section A: Multiple Choice Questions',
        type: 'MCQ' as const,
        count: 5,
        marksPerQuestion: 1,
        difficulty: 'Easy' as const,
      },
      {
        title: 'Section B: Short Answer Questions',
        type: 'Short' as const,
        count: 3,
        marksPerQuestion: 3,
        difficulty: 'Moderate' as const,
      },
      {
        title: 'Section C: Long Answer Questions',
        type: 'Long' as const,
        count: 2,
        marksPerQuestion: 5,
        difficulty: 'Hard' as const,
      },
    ],
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
      {
        title: 'Section A: Multiple Choice Questions',
        type: 'MCQ' as const,
        count: 6,
        marksPerQuestion: 1,
        difficulty: 'Easy' as const,
      },
      {
        title: 'Section B: Short Questions',
        type: 'Short' as const,
        count: 4,
        marksPerQuestion: 3,
        difficulty: 'Moderate' as const,
      },
    ],
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
      {
        title: 'Section A: Multiple Choice Questions',
        type: 'MCQ' as const,
        count: 5,
        marksPerQuestion: 1,
        difficulty: 'Moderate' as const,
      },
      {
        title: 'Section B: Short Answer Questions',
        type: 'Short' as const,
        count: 3,
        marksPerQuestion: 4,
        difficulty: 'Moderate' as const,
      },
      {
        title: 'Section C: Essay Question',
        type: 'Long' as const,
        count: 1,
        marksPerQuestion: 8,
        difficulty: 'Hard' as const,
      },
    ],
  },
];

async function seed() {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Connected to MongoDB.');

  for (const item of SEED_ASSIGNMENTS) {
    console.log(`\nCreating: "${item.title}" (${item.subject} - ${item.grade})...`);
    
    // Create assignment document in database
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
      chapters: item.chapters,
    });

    console.log(`Document created with ID: ${assignment._id}. Generating AI content...`);
    
    try {
      // Call processGenerationJob synchronously to call Groq API and update DB
      await processGenerationJob(assignment._id.toString(), item.sections);
      
      // Reload and verify
      const finalDoc = await Assignment.findById(assignment._id);
      if (finalDoc?.status === 'completed') {
        console.log(`Successfully generated and saved "${item.title}"`);
      } else {
        console.error(`Generation failed for "${item.title}": ${finalDoc?.errorMessage || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error(`Failed to process generation for "${item.title}":`, err.message);
    }
  }

  console.log('\nAll seed operations completed.');
  await mongoose.disconnect();
  console.log('Database connection closed.');
}

seed().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});

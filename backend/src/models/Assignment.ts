import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  text: string;
  options?: string[];
  correctAnswer?: string;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  marks: number;
}

export interface ISection {
  title: string;
  instruction: string;
  questions: IQuestion[];
}

export interface IAssignment extends Document {
  title: string;
  subject: string;
  grade: string;
  dueDate: Date;
  additionalInstructions?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0 to 100
  errorMessage?: string;
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  text: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String },
  difficulty: { type: String, enum: ['Easy', 'Moderate', 'Hard'], required: true },
  marks: { type: Number, required: true },
});

const SectionSchema = new Schema<ISection>({
  title: { type: String, required: true },
  instruction: { type: String, required: true },
  questions: [QuestionSchema],
});

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    dueDate: { type: Date, required: true },
    additionalInstructions: { type: String },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      required: true,
    },
    progress: { type: Number, default: 0, required: true },
    errorMessage: { type: String },
    sections: [SectionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);

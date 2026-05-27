import mongoose, { Schema, Document } from 'mongoose';

export interface ISyllabus extends Document {
  gradeClass: string;
  subjectName: string;
  chapterList: string[];
}

const SyllabusSchema = new Schema<ISyllabus>({
  gradeClass: { type: String, required: true, trim: true },
  subjectName: { type: String, required: true, trim: true },
  chapterList: [{ type: String, required: true, trim: true }],
});

SyllabusSchema.index({ gradeClass: 1, subjectName: 1 }, { unique: true });

export default mongoose.model<ISyllabus>('Syllabus', SyllabusSchema);

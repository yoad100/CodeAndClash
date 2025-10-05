import { Schema, model } from 'mongoose';

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  choices: { type: [String], required: true },
  correctIndex: { type: Number, required: true },
  subject: { type: String },
}, { timestamps: true });

export const Question = model('Question', QuestionSchema);

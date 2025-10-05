import { Request, Response } from 'express';
import { Question } from '../models/question.model';

export const randomQuestions = async (req: Request, res: Response) => {
  const count = parseInt((req.query.count as string) || '5', 10);
  const subject = req.query.subject as string | undefined;

  const filter: any = {};
  if (subject) filter.subject = subject;

  const total = await Question.countDocuments(filter);
  const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - count)));
  const questions = await Question.find(filter).skip(skip).limit(count).lean();

  if (questions.length === 0) {
    // fallback sample
    return res.json({ data: [
      { id: '1', text: 'What is 2+2?', choices: ['3','4','5','6'], correctIndex: 1 }
    ]});
  }

  res.json({ data: questions.map((q: any) => ({ id: q._id, text: q.text, choices: q.choices })) });
};

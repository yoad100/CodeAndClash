import { z } from 'zod';

export const findOpponentSchema = z.object({
  subject: z.string().optional(),
});

export const submitAnswerSchema = z.object({
  matchId: z.string(),
  questionIndex: z.number().int(),
  answerIndex: z.number().int(),
});

export const createPrivateMatchSchema = z.object({ subject: z.string().optional() });
export const joinPrivateMatchSchema = z.object({ inviteCode: z.string() });

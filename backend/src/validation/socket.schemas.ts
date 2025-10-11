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
export const invitePlayerSchema = z.object({
  username: z.string().min(2),
  subject: z.string().optional(),
});

export const respondInviteSchema = z.object({
  inviteId: z.string(),
  accepted: z.boolean(),
});

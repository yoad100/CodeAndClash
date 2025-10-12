import { Schema, model } from 'mongoose';

const MatchSchema = new Schema({
  // Store userId as string so guests (non-ObjectId) are supported; when it's a real user, it's the ObjectId string
  players: [{
    userId: { type: String },
    username: String,
    score: { type: Number, default: 0 },
    avatar: { type: String },
    levelName: { type: String },
    levelKey: { type: String },
    levelIndex: { type: Number },
  }],
  subject: { type: String },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  // Store playerId as string as well for consistency
  answers: [{ playerId: { type: String }, questionIndex: Number, answerIndex: Number, correct: Boolean, timeMs: Number }],
  status: { type: String, enum: ['waiting', 'inprogress', 'finished'], default: 'waiting' },
  startedAt: Date,
  finishedAt: Date,
  result: Schema.Types.Mixed,
}, { timestamps: true });

export const Match = model('Match', MatchSchema);

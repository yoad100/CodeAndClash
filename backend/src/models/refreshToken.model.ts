import { Schema, model } from 'mongoose';

const RefreshTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export const RefreshToken = model('RefreshToken', RefreshTokenSchema);

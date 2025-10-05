import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isPremium: { type: Boolean, default: false },
  rating: { type: Number, default: 1000 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  avatar: { type: String },
}, { timestamps: true });

export const User = model('User', UserSchema);

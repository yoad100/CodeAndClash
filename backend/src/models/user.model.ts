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
  levelName: { type: String, default: 'Intern' },
  levelIndex: { type: Number, default: 12 },
  levelKey: { type: String, default: 'intern' },
  levelUpdatedAt: { type: Date },
  
  // Email verification fields
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  
  // Password reset fields (for future use)
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, { timestamps: true });

export const User = model('User', UserSchema);

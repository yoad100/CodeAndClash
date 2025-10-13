import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refreshToken.model';
import { emailService } from '../services/email.service';
import { buildLevelBreakpoints, getLevelByRank } from '../services/level.service';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '900s';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    // Check for existing email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: {
          email: 'Email already exists'
        }
      });
    }
    
    // Check for existing username
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: {
          username: 'Username already taken'
        }
      });
    }

    // Generate email verification token
    const emailVerificationToken = emailService.generateVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      username, 
      email, 
      passwordHash: hash,
      emailVerificationToken,
      emailVerificationExpires,
      isEmailVerified: false
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, username, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails - user can request resend
    }

    // For production, don't return tokens until email is verified
    // For development, you might want to allow immediate access
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';

    if (requireEmailVerification) {
      // Return success but require email verification
      return res.status(201).json({ 
        message: 'Registration successful. Please check your email to verify your account.',
        emailSent: true,
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          isEmailVerified: false
        }
      });
    } else {
      // Development mode - auto-verify and return tokens
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      const accessToken = (jwt.sign as any)({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
      const refreshToken = (jwt.sign as any)({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

      await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) });

      return res.json({ 
        accessToken, 
        refreshToken, 
        user: { 
          id: user.id, 
          username: user.username,
          email: user.email,
          isEmailVerified: true,
          rating: user.rating,
          wins: user.wins,
          losses: user.losses,
          levelName: user.levelName,
          levelKey: user.levelKey,
          levelIndex: user.levelIndex,
          avatar: user.avatar,
          isPremium: user.isPremium,
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      errors: {
        general: 'Something went wrong. Please try again.'
      }
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if email verification is required and if email is verified
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION !== 'false';
    if (requireEmailVerification && !user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Email not verified',
        error: 'email_not_verified',
        details: 'Please verify your email address before logging in. Check your inbox for the verification link.'
      });
    }

    const totalPlayers = await User.countDocuments({});
    const breakpoints = buildLevelBreakpoints(totalPlayers);
    const higherRanked = await User.countDocuments({ rating: { $gt: user.rating } });
    const computedLevel = getLevelByRank(higherRanked + 1, totalPlayers, breakpoints);

    console.log('🔐 Login level computation:', {
      username: user.username,
      rating: user.rating,
      higherRanked,
      totalPlayers,
      computedLevel: { name: computedLevel.name, key: computedLevel.key, index: computedLevel.index },
      userBefore: { levelName: user.levelName, levelKey: user.levelKey, levelIndex: user.levelIndex },
    });

    if (user.levelKey !== computedLevel.key || user.levelIndex !== computedLevel.index) {
      user.levelName = computedLevel.name;
      user.levelKey = computedLevel.key;
      user.levelIndex = computedLevel.index;
      user.levelUpdatedAt = new Date();
      await user.save();
      console.log('✅ User level updated and saved');
    } else {
      console.log('ℹ️ User level already up to date');
    }

    console.log('📤 Sending login response with user:', {
      username: user.username,
      levelName: user.levelName,
      levelKey: user.levelKey,
      levelIndex: user.levelIndex,
    });

    const accessToken = (jwt.sign as any)({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = (jwt.sign as any)({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

    await RefreshToken.create({ userId: user._id, token: refreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) });

    res.json({ 
      accessToken, 
      refreshToken, 
      user: { 
        id: user.id, 
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        rating: user.rating,
        wins: user.wins,
        losses: user.losses,
        levelName: user.levelName,
        levelKey: user.levelKey,
        levelIndex: user.levelIndex,
        avatar: user.avatar,
        isPremium: user.isPremium,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

  try {
  const payload: any = (jwt.verify as any)(refreshToken, JWT_SECRET);
    const stored = await RefreshToken.findOne({ userId: payload.sub, token: refreshToken });
    if (!stored) return res.status(401).json({ message: 'Invalid token' });

  const accessToken = (jwt.sign as any)({ sub: payload.sub, username: payload.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const newRefresh = (jwt.sign as any)({ sub: payload.sub, username: payload.username }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });

    stored.token = newRefresh;
    stored.expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await stored.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(204).send();

  await RefreshToken.deleteOne({ token: refreshToken });
  res.status(204).send();
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ 
        message: 'Invalid verification token',
        error: 'missing_token'
      });
    }

    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification token',
        error: 'invalid_token'
      });
    }

    // Verify the email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the verification if welcome email fails
    }

    res.json({ 
      message: 'Email verified successfully',
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isEmailVerified: true
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'server_error'
    });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        message: 'Email is required',
        error: 'missing_email'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If an account with this email exists, a verification email has been sent.',
        emailSent: true
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        message: 'Email is already verified',
        error: 'already_verified'
      });
    }

    // Generate new verification token
    const emailVerificationToken = emailService.generateVerificationToken();
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.username, emailVerificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send verification email',
        error: 'email_send_failed'
      });
    }

    res.json({ 
      message: 'Verification email sent successfully',
      emailSent: true
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'server_error'
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    // Always return success for security (don't reveal whether email exists)
    if (!user) {
      return res.json({ message: 'If an account with this email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = emailService.generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset email (best-effort)
    try {
      await emailService.sendPasswordResetEmail(user.email, user.username, resetToken);
    } catch (err) {
      console.error('Failed to send password reset email:', err);
      // don't fail - still return generic success message
    }

    return res.json({ message: 'If an account with this email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Password reset request error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    const { password } = req.body;

    if (!token || typeof token !== 'string') return res.status(400).json({ message: 'Missing token' });
    if (!password || typeof password !== 'string' || password.length < 6) return res.status(400).json({ message: 'Invalid password' });

    const user = await User.findOne({ passwordResetToken: token, passwordResetExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // Update password
    const hash = await bcrypt.hash(password, 10);
    user.passwordHash = hash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate refresh tokens for this user
    await RefreshToken.deleteMany({ userId: user._id });

    // Optionally send a confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.username);
    } catch (err) {
      console.error('Failed to send password changed email:', err);
    }

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

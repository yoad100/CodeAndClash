import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { User } from '../models/user.model';
import { syncUserLevel } from '../services/level.service';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.sub as string | undefined;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { level } = await syncUserLevel(user);

    // strip sensitive fields
    const { _id, username, email, isPremium, rating, wins, losses, avatar, createdAt, updatedAt } = user as any;

    res.json({
      id: _id,
      username,
      email,
      isPremium,
      rating,
      wins,
      losses,
      avatar,
      levelName: level.name,
      levelIndex: level.index,
      levelKey: level.key,
      createdAt,
      updatedAt,
    });
  } catch (err) {
    console.error('GET /users/me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

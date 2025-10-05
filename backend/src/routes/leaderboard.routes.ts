import { Router } from 'express';
import { getTop, getMyRank } from '../controllers/leaderboard.controller';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/top', getTop);
router.get('/me', authenticate, getMyRank);

export default router;

import { Router } from 'express';
import * as questionController from '../controllers/question.controller';

const router = Router();

router.get('/random', questionController.randomQuestions);

export default router;

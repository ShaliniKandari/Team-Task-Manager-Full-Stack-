import express from 'express';
const router = express.Router();
import { signup, login, refresh, logout, me } from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;

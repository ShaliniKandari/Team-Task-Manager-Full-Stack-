import express from 'express';
const router = require('express').Router();
import { signup, login, refresh, logout, me } = require('../controllers/auth');
import { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;

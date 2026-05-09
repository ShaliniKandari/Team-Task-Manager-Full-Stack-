const router = require('express').Router();
const { signup, login, refresh, logout, me } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

module.exports = router;

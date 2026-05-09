const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getMe, updateMe, searchUsers } = require('../controllers/users');

router.use(authenticate);

router.get('/me', getMe);
router.put('/me', updateMe);
router.get('/search', searchUsers);

module.exports = router;

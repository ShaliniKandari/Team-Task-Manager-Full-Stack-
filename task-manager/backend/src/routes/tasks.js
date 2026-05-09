const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listTasks, getTask, createTask, updateTask, deleteTask, getDashboard } = require('../controllers/tasks');

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/', listTasks);
router.post('/', createTask);
router.get('/:taskId', getTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', deleteTask);

module.exports = router;

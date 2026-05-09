const router = require('express').Router();
const { authenticate, requireProjectAdmin, requireProjectMember } = require('../middleware/auth');
const {
  listProjects, getProject, createProject, updateProject, deleteProject,
  addMember, updateMemberRole, removeMember,
} = require('../controllers/projects');

router.use(authenticate);

router.get('/', listProjects);
router.post('/', createProject);
router.get('/:projectId', requireProjectMember, getProject);
router.put('/:projectId', requireProjectAdmin, updateProject);
router.delete('/:projectId', requireProjectAdmin, deleteProject);

router.post('/:projectId/members', requireProjectAdmin, addMember);
router.put('/:projectId/members/:userId', requireProjectAdmin, updateMemberRole);
router.delete('/:projectId/members/:userId', requireProjectAdmin, removeMember);

module.exports = router;

const { z } = require('zod');
const prisma = require('../lib/prisma');

const taskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid(),
});

const listTasks = async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId, overdue } = req.query;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = { not: 'DONE' };
    }

    // Scope to projects the user is a member of
    where.project = { members: { some: { userId: req.user.id } } };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({ tasks });
  } catch (err) { next(err); }
};

const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) { next(err); }
};

const createTask = async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);

    // Verify membership in target project
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: data.projectId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    // Verify assignee is a project member
    if (data.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: data.projectId, userId: data.assigneeId } },
      });
      if (!assigneeMembership) return res.status(400).json({ error: 'Assignee is not a project member' });
    }

    const task = await prisma.task.create({
      data: { ...data, creatorId: req.user.id, dueDate: data.dueDate ? new Date(data.dueDate) : null },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ task });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const data = taskSchema.partial().parse(req.body);
    delete data.projectId; // Can't change project

    const existing = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    // Members can only update their own tasks unless they're admin
    if (membership.role === 'MEMBER' && existing.creatorId !== req.user.id && existing.assigneeId !== req.user.id) {
      return res.status(403).json({ error: 'Can only update tasks you created or are assigned to' });
    }

    const task = await prisma.task.update({
      where: { id: req.params.taskId },
      data: { ...data, dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json({ task });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const existing = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!existing) return res.status(404).json({ error: 'Task not found' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: existing.projectId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a project member' });
    if (membership.role === 'MEMBER' && existing.creatorId !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own tasks' });
    }

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const [totalTasks, myTasks, overdueTasks, statusBreakdown, recentTasks] = await Promise.all([
      prisma.task.count({ where: { project: { members: { some: { userId } } } } }),
      prisma.task.count({ where: { assigneeId: userId, status: { not: 'DONE' } } }),
      prisma.task.count({ where: { assigneeId: userId, dueDate: { lt: now }, status: { not: 'DONE' } } }),
      prisma.task.groupBy({
        by: ['status'],
        where: { project: { members: { some: { userId } } } },
        _count: true,
      }),
      prisma.task.findMany({
        where: { project: { members: { some: { userId } } } },
        include: {
          assignee: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({ totalTasks, myTasks, overdueTasks, statusBreakdown, recentTasks });
  } catch (err) { next(err); }
};

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask, getDashboard };

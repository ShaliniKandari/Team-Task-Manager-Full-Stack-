const { z } = require('zod');
const prisma = require('../lib/prisma');

const projectSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

const listProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: req.user.id } } },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const withRole = projects.map(p => ({
      ...p,
      myRole: p.members.find(m => m.userId === req.user.id)?.role,
    }));

    res.json({ projects: withRole });
  } catch (err) { next(err); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: { ...project, myRole: req.projectRole } });
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const data = projectSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'ADMIN' } },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
    });
    res.status(201).json({ project: { ...project, myRole: 'ADMIN' } });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const data = projectSchema.partial().parse(req.body);
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data,
      include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { tasks: true } } },
    });
    res.json({ project });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) { next(err); }
};

const addMember = async (req, res, next) => {
  try {
    const { email, role = 'MEMBER' } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.projectId, userId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'User already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.projectId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ member });
  } catch (err) { next(err); }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json({ member });
  } catch (err) { next(err); }
};

const removeMember = async (req, res, next) => {
  try {
    if (req.params.userId === req.user.id) return res.status(400).json({ error: 'Cannot remove yourself' });
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: req.params.projectId, userId: req.params.userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) { next(err); }
};

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject, addMember, updateMemberRole, removeMember };

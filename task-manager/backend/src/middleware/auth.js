import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired' });
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware: require user to be ADMIN in the project
const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) return res.status(403).json({ error: 'Not a project member' });
    if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' });

    req.projectRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

// Middleware: require user to be any member of the project
export const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return res.status(400).json({ error: 'Project ID required' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });

    if (!membership) return res.status(403).json({ error: 'Not a project member' });

    req.projectRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};



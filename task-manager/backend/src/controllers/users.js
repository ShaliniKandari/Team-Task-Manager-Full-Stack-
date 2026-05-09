const { z } = require('zod');
const prisma = require('../lib/prisma');

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
});

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json({ user });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email query required' });
    const users = await prisma.user.findMany({
      where: { email: { contains: email, mode: 'insensitive' } },
      select: { id: true, email: true, name: true },
      take: 10,
    });
    res.json({ users });
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe, searchUsers };

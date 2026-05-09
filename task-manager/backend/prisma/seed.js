const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', name: 'Alice Admin', passwordHash },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: { email: 'member@demo.com', name: 'Bob Member', passwordHash },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Demo Project',
      description: 'A sample project to get you started',
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: { projectId: project.id, userId: admin.id, role: 'ADMIN' },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member.id } },
    update: {},
    create: { projectId: project.id, userId: member.id, role: 'MEMBER' },
  });

  const tasks = [
    { title: 'Set up project repository', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Design database schema', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Build REST API', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: member.id },
    { title: 'Create frontend components', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: member.id },
    { title: 'Write unit tests', status: 'TODO', priority: 'MEDIUM', assigneeId: null },
    { title: 'Deploy to Railway', status: 'TODO', priority: 'URGENT', assigneeId: admin.id, dueDate: new Date(Date.now() + 7 * 86400000) },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, projectId: project.id, creatorId: admin.id },
    });
  }

  console.log('Seed complete!');
  console.log('Login: admin@demo.com / password123');
  console.log('Login: member@demo.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());

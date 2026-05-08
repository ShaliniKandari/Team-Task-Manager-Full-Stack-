`# TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control, built with React, Node.js/Express, and PostgreSQL.

## Features

- **Authentication** — JWT-based signup/login with refresh token rotation
- **Projects** — Create projects, invite team members with Admin/Member roles
- **Tasks** — Create, assign, and track tasks with status (Todo → In Progress → In Review → Done) and priority (Low → Urgent)
- **Kanban Board** — Visual drag-ready board per project
- **Dashboard** — Stats overview: total tasks, my tasks, overdue count, status breakdown
- **RBAC** — Admins manage members and delete any task; Members manage their own tasks
- **Validations** — Zod schema validation on all API inputs
- **Security** — Helmet, CORS, rate limiting, bcrypt password hashing

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TailwindCSS, React Router v6 |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (access 15m + refresh 7d) |
| Deployment | Railway |

## Project Structure

```
task-manager/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # DB schema
│   │   └── seed.js             # Demo data
│   ├── src/
│   │   ├── controllers/        # auth, projects, tasks, users
│   │   ├── middleware/         # JWT auth, RBAC
│   │   ├── routes/             # Express routers
│   │   ├── lib/prisma.js       # Prisma client singleton
│   │   └── index.js            # Express app entry
│   ├── railway.toml
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/         # Layout, Modal, TaskCard, TaskForm, TaskBadge
    │   ├── context/            # AuthContext
    │   ├── lib/api.js          # Axios + token refresh interceptor
    │   └── pages/              # Login, Signup, Dashboard, Projects, ProjectDetail, Tasks
    ├── railway.toml
    └── package.json
```

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Docker)

### 1. Clone and install

```bash
git clone <your-repo>

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT secrets

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Set up the database

```bash
cd backend
npx prisma db push          # Create tables
npm run db:seed             # Load demo data
```

### 3. Run dev servers

```bash
# Terminal 1 - Backend (port 3001)
cd backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd frontend && npm run dev
```

Open http://localhost:5173

**Demo accounts:**
- `admin@demo.com` / `password123` (Admin)
- `member@demo.com` / `password123` (Member)

---

## Deploy to Railway

### Step 1 — Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Empty Project**

### Step 2 — Add PostgreSQL

In your project dashboard → **+ New** → **Database** → **PostgreSQL**

### Step 3 — Deploy the Backend

1. **+ New** → **GitHub Repo** → select your repo → set **Root Directory** to `backend`
2. Add these **environment variables** in Railway's Variables tab:

```
DATABASE_URL         = (copy from Railway's Postgres service → Connect tab)
JWT_SECRET           = (generate: openssl rand -hex 32)
JWT_REFRESH_SECRET   = (generate: openssl rand -hex 32)
JWT_EXPIRES_IN       = 15m
JWT_REFRESH_EXPIRES_IN = 7d
NODE_ENV             = production
CLIENT_URL           = https://your-frontend.up.railway.app
PORT                 = 3001
```

3. Railway auto-detects `railway.toml` and runs `npm run db:migrate && npm start`

### Step 4 — Deploy the Frontend

1. **+ New** → **GitHub Repo** → select your repo → set **Root Directory** to `frontend`
2. Add this environment variable:

```
VITE_API_URL = https://your-backend.up.railway.app/api
```

3. Railway builds with `npm run build` and serves with `serve dist`

### Step 5 — Seed demo data (optional)

In the backend service → **Shell** tab:
```bash
node prisma/seed.js
```

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Any | List my projects |
| POST | `/api/projects` | Any | Create project (auto Admin) |
| GET | `/api/projects/:id` | Member | Get project + tasks + members |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |
| POST | `/api/projects/:id/members` | Admin | Add member by email |
| PUT | `/api/projects/:id/members/:userId` | Admin | Change member role |
| DELETE | `/api/projects/:id/members/:userId` | Admin | Remove member |

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Any | List tasks (filterable) |
| POST | `/api/tasks` | Member | Create task |
| GET | `/api/tasks/dashboard` | Any | Dashboard stats |
| GET | `/api/tasks/:id` | Member | Get task |
| PUT | `/api/tasks/:id` | Member/Admin | Update task |
| DELETE | `/api/tasks/:id` | Member/Admin | Delete task |

**Task filters:** `?status=TODO&priority=HIGH&assigneeId=<uuid>&overdue=true`

---

## Data Model

```
User ─────────────── ProjectMember ─── Project
                           │                │
                           │                └── Task
                           │                     ├── assignee (User)
                           └── role              └── creator (User)
                           (ADMIN | MEMBER)
```

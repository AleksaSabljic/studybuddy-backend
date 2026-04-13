# StudyBuddy Backend

REST API backend for the **StudyBuddy** mobile application — a study group management tool that allows students to create and manage study tasks, upload study materials, and communicate in real time.

Built with **Node.js**, **Express**, and **PostgreSQL**.

---

## What the App Does

StudyBuddy helps students organize their study groups by:
- Managing study tasks (create, edit, delete, assign)
- Uploading and downloading study materials (images, PDFs, documents)
- Role-based access so Group Leaders manage tasks and Students view/complete them
- JWT-based authentication to keep data secure

---

## User Roles

| Role | Permissions |
|------|-------------|
| `group_leader` | Create, edit, delete tasks — view all tasks — upload/download files |
| `student` | View only assigned tasks — upload/download files |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| Authentication | JWT (JSON Web Tokens) |
| Password Hashing | bcryptjs |
| File Upload | Multer |
| API Docs | Swagger UI |
| Containerization | Docker + Docker Compose |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ✗ | Register a new user |
| POST | `/auth/login` | ✗ | Login and receive JWT token |

### Tasks
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/tasks` | ✓ | any | List tasks (role-filtered) |
| GET | `/tasks/:id` | ✓ | any | Get single task with files |
| POST | `/tasks` | ✓ | group_leader | Create a new task |
| PUT | `/tasks/:id` | ✓ | group_leader | Update a task |
| DELETE | `/tasks/:id` | ✓ | group_leader | Delete a task |

### Files
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/files/upload` | ✓ | Upload binary file (image, PDF, doc) |
| GET | `/files/:id` | ✓ | Download a file |
| DELETE | `/files/:id` | ✓ | Delete a file |

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Unique user ID |
| username | VARCHAR | Unique username |
| email | VARCHAR | Unique email address |
| password_hash | VARCHAR | bcrypt hashed password |
| role | VARCHAR | `group_leader` or `student` |
| created_at | TIMESTAMP | Account creation time |

### tasks
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Unique task ID |
| title | VARCHAR | Task title |
| description | TEXT | Task description |
| created_by | FK → users | Group leader who created it |
| assigned_to | FK → users | Student assigned to the task |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### files
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Unique file ID |
| task_id | FK → tasks | Task this file belongs to |
| uploaded_by | FK → users | User who uploaded it |
| filename | VARCHAR | Stored filename on disk |
| original_name | VARCHAR | Original filename |
| mimetype | VARCHAR | File MIME type |
| size | INTEGER | File size in bytes |
| created_at | TIMESTAMP | Upload time |

---

## Running with Docker (Recommended)

The easiest way — no manual PostgreSQL setup needed.

### Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Steps
```bash
docker-compose up --build
```

The API will be available at:
- **API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/api-docs

To stop:
```bash
docker-compose down
```

---

## Manual Setup (Local Development)

### Requirements
- Node.js 20+
- PostgreSQL 18

### Steps

**1. Install dependencies**
```bash
npm install
```

**2. Create the database**
```bash
psql -U postgres -c "CREATE DATABASE studybuddy;"
psql -U postgres -d studybuddy -f database.sql
```

**3. Configure environment**
```bash
cp .env.example .env
# Edit .env and fill in your DB password and JWT secret
```

**4. Start the server**
```bash
npm start
```

---

## Testing the API

Interactive Swagger UI is available at:
```
http://localhost:3000/api-docs
```

### Quick test flow:
1. `POST /auth/register` — create a group_leader account
2. `POST /auth/login` — get your JWT token
3. Click **Authorize** in Swagger and paste the token
4. `POST /tasks` — create a task
5. `POST /files/upload` — upload a file to the task
6. `GET /files/:id` — download the file

---

## Project Structure

```
studybuddy-backend/
├── server.js                  # Entry point
├── database.sql               # DB schema and seed data
├── Dockerfile                 # Docker image config
├── docker-compose.yml         # Docker services (API + PostgreSQL)
├── .env.example               # Environment variable template
└── src/
    ├── config/
    │   └── db.js              # PostgreSQL connection pool
    ├── middleware/
    │   └── auth.js            # JWT authentication middleware
    ├── routes/
    │   ├── auth.js            # Register and login
    │   ├── tasks.js           # Task CRUD endpoints
    │   └── files.js           # File upload/download endpoints
    ├── swagger.js             # Swagger configuration
    └── uploads/               # Stored binary files
```

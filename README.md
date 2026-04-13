# StudyBuddy Backend

REST API for the StudyBuddy mobile application built with Node.js, Express, and PostgreSQL.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create PostgreSQL database
```bash
psql -U postgres -c "CREATE DATABASE studybuddy;"
psql -U postgres -d studybuddy -f database.sql
```

### 3. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB credentials and a strong JWT_SECRET
```

### 4. Start the server
```bash
npm start          # production
npm run dev        # development with auto-reload (nodemon)
```

---

## API Endpoints

| Method | Route            | Auth | Role          | Description              |
|--------|-----------------|------|---------------|--------------------------|
| POST   | /auth/register  | ✗    | —             | Register new user        |
| POST   | /auth/login     | ✗    | —             | Login, receive JWT       |
| GET    | /tasks          | ✓    | any           | List tasks (role-filtered)|
| GET    | /tasks/:id      | ✓    | any           | Get single task + files  |
| POST   | /tasks          | ✓    | group_leader  | Create task              |
| PUT    | /tasks/:id      | ✓    | group_leader  | Update task              |
| DELETE | /tasks/:id      | ✓    | group_leader  | Delete task              |
| POST   | /files/upload   | ✓    | any           | Upload binary file       |
| GET    | /files/:id      | ✓    | any           | Download file            |
| DELETE | /files/:id      | ✓    | any           | Delete file              |
| GET    | /health         | ✗    | —             | Server health check      |

## Swagger Docs

Interactive API documentation available at:
```
http://localhost:3000/api-docs
```

## Roles

| Role          | Can do                                              |
|---------------|-----------------------------------------------------|
| group_leader  | Full CRUD on tasks, upload/download files           |
| student       | View only assigned tasks, upload/download files     |

## Seed users (password: `password123`)

| Email                    | Role         |
|--------------------------|--------------|
| alice@studybuddy.com     | group_leader |
| bob@studybuddy.com       | student      |

# StudyBuddy — Backend

**Course:** Základy mobilných a bezdrôtových technológií | LS 2026  
**Student:** Aleksa Sabljic

REST API + WebSocket server for the StudyBuddy mobile application, built with Node.js, Express, and PostgreSQL.

The frontend (Flutter) supports both Android and Chrome (PVP1). The backend serves both platforms identically — no platform-specific logic is required on the server side.

---

## Links

| Resource | Link |
|----------|------|
| Frontend GitHub | https://github.com/AleksaSabljic/studybuddy-frontend |
| API Documentation (Swagger) | http://localhost:3000/api-docs |

---

## Running with Docker (recommended)

The easiest way to run the project — no manual PostgreSQL setup needed.

### Requirements
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Steps
```bash
docker-compose up --build
```

The API will be running at:
- API: http://localhost:3000
- Swagger docs: http://localhost:3000/api-docs
- WebSocket: ws://localhost:3000

To stop:
```bash
docker-compose down
```

---

## Manual Setup

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

Create a `.env` file in the project root:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=studybuddy
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
```

### 4. Start the server
```bash
npm start          # production
npm run dev        # development with auto-reload (nodemon)
```

---

## API Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /auth/register | — | — | Register new user with role |
| POST | /auth/login | — | — | Login, receive JWT token |
| GET | /auth/users | JWT | any | List all users (for task assignment) |
| GET | /tasks | JWT | any | List tasks (role-filtered) |
| GET | /tasks/:id | JWT | any | Get single task with attached files |
| POST | /tasks | JWT | group_leader | Create a task |
| PUT | /tasks/:id | JWT | group_leader | Update a task |
| DELETE | /tasks/:id | JWT | group_leader | Delete a task |
| POST | /files/upload | JWT | any | Upload binary file (multipart) |
| GET | /files/:id | JWT via ?token= | any | Download file as binary stream |
| DELETE | /files/:id | JWT | any | Delete a file |
| POST | /location | JWT | any | Share or update GPS coordinates |
| GET | /location/group | JWT | any | Get all active group locations |
| DELETE | /location | JWT | any | Stop sharing location |
| GET | /health | — | — | Server health check |

---

## WebSocket — Group Chat

Runs on the same port as HTTP (3000).  
Connect with: `ws://localhost:3000?token=<jwt>`

On connect, the last 50 messages are sent as history. All messages are saved to the database and persist across reconnects.

```json
// Send
{ "type": "message", "text": "Hello!" }

// Receive
{ "type": "message", "text": "Hello!", "username": "alice", "userId": 1, "timestamp": "..." }

// On connect
{ "type": "history", "messages": [ ... ] }
```

---

## Roles

| Role | Permissions |
|------|-------------|
| group_leader | Full CRUD on tasks, upload/download files, chat |
| student | View assigned tasks only, upload/download files, chat |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts with roles |
| tasks | Study tasks with assignment |
| task_files | Uploaded study materials |
| chat_messages | Persistent group chat history |
| user_locations | Active GPS locations (auto-expires after 5 min) |

---

## Tech Stack

- **Node.js + Express** — REST API
- **PostgreSQL** — database
- **ws** — WebSocket server
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT authentication
- **multer** — binary file uploads
- **Swagger UI** — interactive API docs
- **Docker + Docker Compose** — containerized deployment

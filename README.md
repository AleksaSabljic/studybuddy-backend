# StudyBuddy — Backend

**Course:** Základy mobilných a bezdrôtových technológií | LS 2026
**Student:** Aleksa Sabljic

REST API for the StudyBuddy mobile application, built with Node.js, Express, PostgreSQL, and WebSockets.

---

## Links

| Resource | Link |
|----------|------|
| Frontend GitHub | https://github.com/AleksaSabljic/studybuddy-frontend |
| API Documentation (Swagger) | http://localhost:3000/api-docs |

---

## Running the Backend

### Option 1 — Docker (recommended, no PostgreSQL setup needed)

```
docker-compose up --build
```

The API will be available at http://localhost:3000

To stop:

```
docker-compose down
```

### Option 2 — Manual setup

```
npm install
psql -U postgres -c "CREATE DATABASE studybuddy;"
psql -U postgres -d studybuddy -f database.sql
cp .env.example .env
node server.js
```

---

## API Endpoints (15 total)

Full interactive documentation at http://localhost:3000/api-docs

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

## Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts with roles |
| tasks | Study tasks with assignment |
| files | Uploaded study materials |
| chat_messages | Persistent group chat history |
| user_locations | Active GPS locations (auto-expires after 5 min) |

---

## WebSocket Chat

Runs on the same port as HTTP (3000).
Connect with: ws://localhost:3000?token=JWT_TOKEN
On connect, the last 50 messages are sent as history. All messages are saved to the database and persist across reconnects.

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

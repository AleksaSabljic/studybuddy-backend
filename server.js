require('dotenv').config();

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');

const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');
const fileRoutes = require('./src/routes/files');
const locationRoutes = require('./src/routes/location');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API Documentation ─────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Routes ────────────────────────────────────────────────────
app.use('/auth',     authRoutes);
app.use('/tasks',    taskRoutes);
app.use('/files',    fileRoutes);
app.use('/location', locationRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// ── Start (HTTP + WebSocket on same port) ─────────────────────
const http = require('http');
const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

const server = http.createServer(app);

const pool = require('./src/config/db');
const wss = new WebSocketServer({ server });
const clients = new Map();

// Create messages table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    username VARCHAR(100),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

// Create location table if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS user_locations (
    user_id INTEGER PRIMARY KEY,
    username VARCHAR(100),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  let user = null;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    ws.close(1008, 'Invalid token');
    return;
  }

  clients.set(ws, { username: user.username, userId: user.id });
  console.log(`WS: ${user.username} connected`);

  // Send last 50 messages from DB
  try {
    const result = await pool.query(
      'SELECT user_id, username, text, created_at FROM chat_messages ORDER BY created_at DESC LIMIT 50'
    );
    const history = result.rows.reverse().map(r => ({
      type: 'message',
      text: r.text,
      username: r.username,
      userId: r.user_id,
      timestamp: r.created_at.toISOString(),
    }));
    ws.send(JSON.stringify({ type: 'history', messages: history }));
  } catch (e) {
    console.error('History load error:', e);
  }

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type !== 'message' || !msg.text) return;
      const out = {
        type: 'message',
        text: msg.text,
        username: user.username,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };
      // Save to DB
      await pool.query(
        'INSERT INTO chat_messages (user_id, username, text) VALUES ($1, $2, $3)',
        [user.id, user.username, msg.text]
      );
      wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(out));
        }
      });
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`WS: ${user.username} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀  StudyBuddy API running at http://localhost:${PORT}`);
  console.log(`📖  Swagger docs at   http://localhost:${PORT}/api-docs`);
  console.log(`🔌  WebSocket chat ready on ws://localhost:${PORT}\n`);
});

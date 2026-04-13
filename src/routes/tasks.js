const express = require('express');
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All task routes require a valid JWT
router.use(authenticate);

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks (Group Leaders see all, Students see only assigned tasks)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tasks
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req, res) => {
  try {
    let result;

    if (req.user.role === 'group_leader') {
      // Group leaders see all tasks
      result = await pool.query(`
        SELECT t.*, 
          u1.username AS created_by_name, 
          u2.username AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        ORDER BY t.created_at DESC
      `);
    } else {
      // Students only see their assigned tasks
      result = await pool.query(`
        SELECT t.*,
          u1.username AS created_by_name,
          u2.username AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u1 ON t.created_by = u1.id
        LEFT JOIN users u2 ON t.assigned_to = u2.id
        WHERE t.assigned_to = $1
        ORDER BY t.created_at DESC
      `, [req.user.id]);
    }

    res.json({ tasks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a single task by ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        u1.username AS created_by_name,
        u2.username AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      WHERE t.id = $1
    `, [req.params.id]);

    const task = result.rows[0];
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Students can only view their own assigned tasks
    if (req.user.role === 'student' && task.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch attached files
    const files = await pool.query(
      'SELECT id, original_name, mimetype, size, created_at FROM files WHERE task_id = $1',
      [task.id]
    );

    res.json({ task, files: files.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task (Group Leader only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: Math Homework
 *               description:
 *                 type: string
 *                 example: Solve exercises 1-10
 *               assigned_to:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Task created
 *       403:
 *         description: Students cannot create tasks
 */
router.post('/', requireRole('group_leader'), async (req, res) => {
  const { title, description, assigned_to } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, created_by, assigned_to)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description || null, req.user.id, assigned_to || null]
    );

    res.status(201).json({
      message: 'Task created successfully',
      task: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task (Group Leader only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assigned_to:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task updated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.put('/:id', requireRole('group_leader'), async (req, res) => {
  const { title, description, assigned_to } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const result = await pool.query(
      `UPDATE tasks
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           assigned_to = COALESCE($3, assigned_to),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [title, description, assigned_to, req.params.id]
    );

    res.json({
      message: 'Task updated successfully',
      task: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task (Group Leader only)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task deleted
 *       403:
 *         description: Access denied
 *       404:
 *         description: Task not found
 */
router.delete('/:id', requireRole('group_leader'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING id, title',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({
      message: 'Task deleted successfully',
      task: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

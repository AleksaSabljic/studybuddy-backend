const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer config — stores real binary files on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and common document formats
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// All file routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /files/upload:
 *   post:
 *     summary: Upload a binary file attached to a task
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, task_id]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               task_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Missing file or task_id
 *       404:
 *         description: Task not found
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const { task_id } = req.body;
  if (!task_id) {
    // Clean up uploaded file if task_id missing
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'task_id is required' });
  }

  try {
    // Verify task exists
    const task = await pool.query('SELECT id FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Task not found' });
    }

    const result = await pool.query(
      `INSERT INTO files (task_id, uploaded_by, filename, original_name, mimetype, size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, original_name, mimetype, size, created_at`,
      [
        task_id,
        req.user.id,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      ]
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    // Clean up on DB error
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Download a file by its ID
 *     tags: [Files]
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
 *         description: Binary file stream
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: File not found
 */
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1',
      [req.params.id]
    );

    const file = result.rows[0];
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File missing from storage' });
    }

    res.setHeader('Content-Type', file.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete a file by its ID
 *     tags: [Files]
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
 *         description: File deleted
 *       404:
 *         description: File not found
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM files WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    const file = result.rows[0];
    if (!file) return res.status(404).json({ message: 'File not found' });

    // Remove from disk
    const filePath = path.join(UPLOAD_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
});

module.exports = router;

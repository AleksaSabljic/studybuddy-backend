-- ============================================================
-- StudyBuddy Database Schema
-- Run: psql -U postgres -d studybuddy -f database.sql
-- ============================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE studybuddy;

-- Drop tables if re-running
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS
-- Roles: 'group_leader' | 'student'
-- ============================================================
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(100)  NOT NULL UNIQUE,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(50)   NOT NULL CHECK (role IN ('group_leader', 'student')),
  created_at  TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- TASKS
-- Only group_leaders can create/edit/delete tasks
-- Students can view tasks assigned to them
-- ============================================================
CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255)  NOT NULL,
  description TEXT,
  created_by  INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP     DEFAULT NOW(),
  updated_at  TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- FILES
-- Binary files attached to tasks (images, PDFs, docs)
-- ============================================================
CREATE TABLE files (
  id            SERIAL PRIMARY KEY,
  task_id       INTEGER       REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by   INTEGER       REFERENCES users(id) ON DELETE SET NULL,
  filename      VARCHAR(255)  NOT NULL,
  original_name VARCHAR(255)  NOT NULL,
  mimetype      VARCHAR(100),
  size          INTEGER,
  created_at    TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- Seed data for testing
-- Passwords are bcrypt hashes of 'password123'
-- ============================================================
INSERT INTO users (username, email, password_hash, role) VALUES
  ('alice_leader', 'alice@studybuddy.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'group_leader'),
  ('bob_student',  'bob@studybuddy.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

INSERT INTO tasks (title, description, created_by, assigned_to) VALUES
  ('Math Homework', 'Solve exercises 1-10 from chapter 3', 1, 2),
  ('Physics Lab Report', 'Write up the pendulum experiment results', 1, 2);

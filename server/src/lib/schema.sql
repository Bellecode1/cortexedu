-- =============================================================
-- SCHÉMA CORTEXEDU - À EXÉCUTER DANS LE SQL EDITOR SUPABASE
-- =============================================================
-- Va dans ton dashboard Supabase → SQL Editor → colle et exécute
-- =============================================================

-- Supprimer les tables si elles existent déjà (optionnel)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS exams;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS quiz;
DROP TABLE IF EXISTS branch;
DROP TABLE IF EXISTS users;

-- =============================================================
-- TABLE: users
-- =============================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  surname TEXT DEFAULT '',
  mail TEXT,
  password TEXT,
  telephone TEXT DEFAULT '',
  role TEXT DEFAULT 'Student',
  dob TEXT DEFAULT '',
  "verificationCode" TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  "studentArrayId" JSONB DEFAULT '[]'::jsonb,
  sexe TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  "brancnId" TEXT DEFAULT '',
  "resetCode" TEXT,
  "resetCodeExpires" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mail ON users(mail);

-- =============================================================
-- TABLE: branch
-- =============================================================
CREATE TABLE branch (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  create_at TEXT DEFAULT ''
);

-- =============================================================
-- TABLE: quiz
-- =============================================================
CREATE TABLE quiz (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  "authorId" TEXT,
  "branchId" JSONB DEFAULT '[]'::jsonb,
  "createAt" TEXT,
  "create_At" TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "typeOfTime" TEXT,
  "quizQuestions" JSONB DEFAULT '[]'::jsonb
);

-- =============================================================
-- TABLE: results
-- =============================================================
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  "studentId" TEXT,
  "quizId" TEXT,
  score TEXT DEFAULT '',
  percent NUMERIC DEFAULT 0,
  feedback TEXT DEFAULT '',
  name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  "authorId" TEXT,
  "branchId" JSONB DEFAULT '[]'::jsonb,
  "createAt" TEXT,
  "create_At" TEXT,
  "startDate" TEXT,
  "endDate" TEXT,
  "typeOfTime" TEXT,
  "quizQuestions" JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'complete',
  "completedAt" TEXT
);

-- =============================================================
-- TABLE: exams
-- =============================================================
CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  file_path TEXT DEFAULT '',
  teacher_id TEXT,
  teacher_name TEXT DEFAULT '',
  branch_id TEXT,
  due_date TEXT,
  created_at TEXT DEFAULT ''
);

-- =============================================================
-- TABLE: submissions
-- =============================================================
CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  exam_id TEXT,
  student_id TEXT,
  file_path TEXT DEFAULT '',
  submitted_at TEXT DEFAULT '',
  grade NUMERIC,
  comment TEXT,
  graded_by TEXT,
  graded_at TEXT
);

-- =============================================================
-- TABLE: notifications
-- =============================================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT DEFAULT '',
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  link TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TEXT DEFAULT ''
);

-- Vérification : lister les tables créées
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

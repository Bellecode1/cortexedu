// User Roles
export type UserRole = 'Student' | 'Parent' | 'Teacher' | 'Administrateur';

export interface User {
  id: string;
  name: string;
  surname: string;
  mail: string;
  telephone: string;
  role: UserRole;
  dob: string;
  verificationCode: string;
  verified: boolean;
  sexe: 'Male' | 'Female';
  adresse: string;
  brancnId?: string;
  studentArrayId: string[];
  password?: string;
}

export interface UserFormData {
  name: string;
  surname: string;
  mail: string;
  telephone: string;
  role: UserRole;
  dob: string;
  sexe: 'Male' | 'Female';
  adresse: string;
  brancnId?: string;
  studentArrayId?: string[];
  confirm_password?: string;
}

// Branch
export interface Branch {
  id: string;
  name: string;
  description: string;
  create_at: string;
}

export interface BranchFormData {
  name: string;
  description: string;
}

// Quiz Question
export interface QuizQuestion {
  id: string;
  quizId: string;
  mainQuestion: string;
  choices: string[];
  correctAnswer: number;
  time: number;
  marks: number;
}

// Quiz
export type QuizTimeType = 'global Time' | 'time for any question';

export interface Quiz {
  id: string;
  name: string;
  description: string;
  authorId: string;
  branchId: string[];
  createAt: string;
  startDate: string;
  endDate: string;
  typeOfTime: QuizTimeType;
  quizQuestions: QuizQuestion[];
}

export interface QuizFormData {
  name: string;
  description: string;
  branchId: string[];
  startDate: string;
  endDate: string;
  typeOfTime: QuizTimeType;
  quizQuestions?: QuizQuestion[];
  authorId?: string;
}

// Quiz Result (retourné par l'API pour les étudiants)
export interface StudentQuizResult {
  id: string;
  studentId: string;
  quizId: string;
  name: string;
  description: string;
  authorId: string;
  branchId: string[];
  createAt: string;
  startDate: string;
  endDate: string;
  typeOfTime: QuizTimeType;
  quizQuestions: QuizQuestion[];
  score: string; // format: "6/10"
  percent: number;
  feedback: string;
  status: string;
}

export interface QuizResult {
  studentId: string;
  score: string;
  quizId: string;
  name: string;
  description: string;
  authorId: string;
  branchId: string[];
  createAt: string;
  startDate: string;
  endDate: string;
  typeOfTime: QuizTimeType;
  quizQuestions: QuizQuestion[];
}

export interface Result {
  id: string;
  studentId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  completedAt: string;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

export interface ResultFormData {
  studentId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: {
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ProfileResponse {
  username: string;
  email: string;
}

// ─── Examens (Épreuves) ───
export interface Exam {
  id: string;
  title: string;
  description: string;
  file_path: string;
  teacher_id: string;
  teacher_name?: string;
  branch_id?: string | null;
  due_date?: string | null;
  created_at: string;
}

export interface ExamFormData {
  title: string;
  description?: string;
  branch_id?: string;
  due_date?: string;
}

// ─── Soumissions (Copies) ───
export interface Submission {
  id: string;
  exam_id: string;
  exam_title?: string;
  student_id: string;
  student_name?: string;
  file_path: string;
  submitted_at: string;
  grade?: number | null;
  comment?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
}

export interface GradeFormData {
  grade: number;
  comment?: string;
}

// ─── Notifications ───
export interface Notification {
  id: string;
  user_id: string;
  type: 'submission' | 'grade' | 'quiz' | 'info';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ─── Dashboard Stats ───
export interface TeacherQuizStats {
  quizId: string;
  quizName: string;
  totalStudents: number;
  average: number;
  highest: number;
  lowest: number;
  passRate: number;
  scoreDistribution: { range: string; count: number }[];
}

export interface StudentPerformanceData {
  name: string;
  score: number;
  date: string;
}

// API Error
export interface ApiError {
  status: number;
  data: {
    error: string;
    message?: string;
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Teacher" | "Student";
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublished: boolean;
  questionCount: number;
  totalMarks: number;
  passingMarks: number;
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  allowedStudentEmails: string[];
  /** Teacher lifecycle: draft | upcoming | active | completed | rejected */
  status: "draft" | "upcoming" | "active" | "completed" | "rejected";
  /** Student view: current | attempted | missed (undefined for teachers) */
  studentStatus?: "current" | "attempted" | "missed";
}

export interface QuizDetail {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  isPublished: boolean;
  totalMarks: number;
  passingMarks: number;
  questions: Question[];
  createdAt: string;
  startTime: string | null;
  endTime: string | null;
  allowedStudentEmails: string[];
  status: "draft" | "upcoming" | "active" | "completed" | "rejected";
}

// ─── Questions ───────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  text: string;
  type: "MultipleChoice" | "TrueFalse" | "ShortAnswer";
  options: string[];
  points: number;
  orderIndex: number;
}

export interface QuestionWithAnswer extends Question {
  correctAnswer: string;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface StudentUser {
  id: string;
  name: string;
  email: string;
}

// ─── Teacher Dashboard ────────────────────────────────────────────────────────

export interface QuizOverview {
  id: string;
  title: string;
  status: "draft" | "upcoming" | "active" | "completed" | "rejected";
  questionCount: number;
  attemptCount: number;
  averageScore: number;
  startTime: string | null;
  endTime: string | null;
}

export interface StudentBrief {
  id: string;
  name: string;
  email: string;
  attemptCount: number;
  averageScore: number;
  joinedAt: string;
}

export interface TeacherDashboard {
  totalQuizzes: number;
  activeQuizzes: number;
  totalStudents: number;
  totalAttempts: number;
  quizzes: QuizOverview[];
  students: StudentBrief[];
}

export interface StudentAttemptSummary {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingMarks: number;
  completedAt: string;
}

export interface StudentDetail {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  totalAttempts: number;
  overallAverage: number;
  attempts: StudentAttemptSummary[];
}

// ─── Attempts ─────────────────────────────────────────────────────────────────

export interface AttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passingMarks: number;
  duration: string;
  answerResults: AnswerResult[];
}

export interface AnswerResult {
  questionId: string;
  questionText: string;
  yourAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  pointsEarned: number;
}

export interface MyAttempt {
  id: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
}

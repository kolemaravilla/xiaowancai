export interface StudyItem {
  id: string;
  term: string;
  definition: string;
  kind: "concept" | "tool" | "command" | "library" | "service" | "pattern" | "framework" | "language-feature";
  language: string;
  project: string;
  category: string;
  whatItIs: string;
  whyItExists: string;
  whereItRuns: string;
  whatItTouches: string;
  whatBreaks: string;
  projectUsage: string;
  commonConfusion: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  categories: string[];
  items: StudyItem[];
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  items: StudyItem[];
  order: number;
}

export interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "fill-blank";
  question: string;
  options?: string[];
  correctAnswer: number | boolean;
  explanation: string;
  itemId: string;
}

export type MasteryLevel = "new" | "seen" | "learning" | "mastered";

export interface UserProgress {
  xp: number;
  streak: number;
  lastStudyDate: string;
  completedLessons: string[];
  itemMastery: Record<string, MasteryLevel>;
  quizHighScores: Record<string, number>;
  achievements: string[];
  totalItemsStudied: number;
  totalQuizzesTaken: number;
  totalCorrectAnswers: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  condition: (progress: UserProgress) => boolean;
}

export type View = "dashboard" | "learn" | "module" | "lesson" | "practice" | "quiz-active" | "explore";

export type FilterState = {
  search: string;
  kind: string;
  project: string;
  category: string;
};

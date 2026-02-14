import type { UserProgress, MasteryLevel } from "./types";

const STORAGE_KEY = "codelearner-progress";

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lastStudyDate: "",
  completedLessons: [],
  itemMastery: {},
  quizHighScores: {},
  achievements: [],
  totalItemsStudied: 0,
  totalQuizzesTaken: 0,
  totalCorrectAnswers: 0,
};

export function loadProgress(): UserProgress {
  if (typeof window === "undefined") return { ...DEFAULT_PROGRESS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROGRESS, ...parsed };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function updateStreak(progress: UserProgress): UserProgress {
  const today = new Date().toISOString().split("T")[0];
  if (progress.lastStudyDate === today) return progress;

  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];
  const newStreak =
    progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;

  return { ...progress, streak: newStreak, lastStudyDate: today };
}

export function addXP(progress: UserProgress, amount: number): UserProgress {
  return updateStreak({ ...progress, xp: progress.xp + amount });
}

export function completeLesson(
  progress: UserProgress,
  lessonId: string,
  itemIds: string[]
): UserProgress {
  if (progress.completedLessons.includes(lessonId)) return progress;

  const newMastery = { ...progress.itemMastery };
  let newStudied = progress.totalItemsStudied;
  for (const id of itemIds) {
    if (!newMastery[id] || newMastery[id] === "new") {
      newMastery[id] = "seen";
      newStudied++;
    }
  }

  return addXP(
    {
      ...progress,
      completedLessons: [...progress.completedLessons, lessonId],
      itemMastery: newMastery,
      totalItemsStudied: newStudied,
    },
    50
  );
}

export function recordQuizResult(
  progress: UserProgress,
  quizId: string,
  correct: number,
  total: number,
  itemResults: { itemId: string; correct: boolean }[]
): UserProgress {
  const score = Math.round((correct / total) * 100);
  const prevBest = progress.quizHighScores[quizId] || 0;

  const newMastery = { ...progress.itemMastery };
  for (const r of itemResults) {
    const current = newMastery[r.itemId] || "new";
    if (r.correct) {
      if (current === "new" || current === "seen") newMastery[r.itemId] = "learning";
      else if (current === "learning") newMastery[r.itemId] = "mastered";
    } else {
      if (current === "mastered") newMastery[r.itemId] = "learning";
    }
  }

  const xpGain = correct * 10 + (score === 100 ? 25 : 0);

  return addXP(
    {
      ...progress,
      quizHighScores: {
        ...progress.quizHighScores,
        [quizId]: Math.max(score, prevBest),
      },
      itemMastery: newMastery,
      totalQuizzesTaken: progress.totalQuizzesTaken + 1,
      totalCorrectAnswers: progress.totalCorrectAnswers + correct,
    },
    xpGain
  );
}

export function getItemMastery(
  progress: UserProgress,
  itemId: string
): MasteryLevel {
  return progress.itemMastery[itemId] || "new";
}

export function getLevel(xp: number): {
  level: number;
  currentXP: number;
  requiredXP: number;
  title: string;
} {
  const thresholds = [
    0, 100, 250, 500, 1000, 1750, 2750, 4000, 5500, 7500, 10000,
  ];
  const titles = [
    "Beginner",
    "Novice",
    "Apprentice",
    "Student",
    "Coder",
    "Developer",
    "Engineer",
    "Architect",
    "Expert",
    "Master",
    "Grandmaster",
  ];

  let level = 0;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (xp >= thresholds[i]) {
      level = i;
      break;
    }
  }

  const currentXP = xp - thresholds[level];
  const requiredXP =
    level < thresholds.length - 1
      ? thresholds[level + 1] - thresholds[level]
      : 2500;

  return { level: level + 1, currentXP, requiredXP, title: titles[level] };
}

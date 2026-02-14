import type { Achievement, UserProgress } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    title: "First Steps",
    description: "Complete your first lesson",
    icon: "\u{1F476}",
    xpReward: 25,
    condition: (p) => p.completedLessons.length >= 1,
  },
  {
    id: "five-lessons",
    title: "Getting Serious",
    description: "Complete 5 lessons",
    icon: "\u{1F4DA}",
    xpReward: 50,
    condition: (p) => p.completedLessons.length >= 5,
  },
  {
    id: "twenty-lessons",
    title: "Dedicated Learner",
    description: "Complete 20 lessons",
    icon: "\u{1F393}",
    xpReward: 100,
    condition: (p) => p.completedLessons.length >= 20,
  },
  {
    id: "fifty-lessons",
    title: "Knowledge Seeker",
    description: "Complete 50 lessons",
    icon: "\u{1F9D9}",
    xpReward: 200,
    condition: (p) => p.completedLessons.length >= 50,
  },
  {
    id: "first-quiz",
    title: "Quiz Taker",
    description: "Complete your first quiz",
    icon: "\u{1F4DD}",
    xpReward: 25,
    condition: (p) => p.totalQuizzesTaken >= 1,
  },
  {
    id: "ten-quizzes",
    title: "Quiz Master",
    description: "Complete 10 quizzes",
    icon: "\u{1F3AF}",
    xpReward: 75,
    condition: (p) => p.totalQuizzesTaken >= 10,
  },
  {
    id: "perfect-score",
    title: "Perfectionist",
    description: "Get 100% on a quiz",
    icon: "\u{1F4AF}",
    xpReward: 50,
    condition: (p) => Object.values(p.quizHighScores).some((s) => s === 100),
  },
  {
    id: "streak-3",
    title: "On Fire",
    description: "Reach a 3-day streak",
    icon: "\u{1F525}",
    xpReward: 30,
    condition: (p) => p.streak >= 3,
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "\u{1F4AA}",
    xpReward: 75,
    condition: (p) => p.streak >= 7,
  },
  {
    id: "streak-30",
    title: "Unstoppable",
    description: "Reach a 30-day streak",
    icon: "\u{1F451}",
    xpReward: 300,
    condition: (p) => p.streak >= 30,
  },
  {
    id: "items-50",
    title: "Half Century",
    description: "Study 50 items",
    icon: "\u{1F3C5}",
    xpReward: 50,
    condition: (p) => p.totalItemsStudied >= 50,
  },
  {
    id: "items-100",
    title: "Century",
    description: "Study 100 items",
    icon: "\u{1F3C6}",
    xpReward: 100,
    condition: (p) => p.totalItemsStudied >= 100,
  },
  {
    id: "items-300",
    title: "Scholar",
    description: "Study 300 items",
    icon: "\u{1F4D6}",
    xpReward: 200,
    condition: (p) => p.totalItemsStudied >= 300,
  },
  {
    id: "items-all",
    title: "Completionist",
    description: "Study all 632 items",
    icon: "\u{1F48E}",
    xpReward: 500,
    condition: (p) => p.totalItemsStudied >= 632,
  },
  {
    id: "mastered-10",
    title: "Mastery Begins",
    description: "Master 10 items",
    icon: "\u2B50",
    xpReward: 50,
    condition: (p) =>
      Object.values(p.itemMastery).filter((m) => m === "mastered").length >= 10,
  },
  {
    id: "mastered-50",
    title: "True Mastery",
    description: "Master 50 items",
    icon: "\u{1F31F}",
    xpReward: 150,
    condition: (p) =>
      Object.values(p.itemMastery).filter((m) => m === "mastered").length >= 50,
  },
  {
    id: "xp-1000",
    title: "XP Milestone",
    description: "Earn 1,000 XP",
    icon: "\u{1F4B0}",
    xpReward: 50,
    condition: (p) => p.xp >= 1000,
  },
  {
    id: "xp-5000",
    title: "XP Legend",
    description: "Earn 5,000 XP",
    icon: "\u{1F48E}",
    xpReward: 100,
    condition: (p) => p.xp >= 5000,
  },
];

export function checkNewAchievements(
  progress: UserProgress
): Achievement[] {
  return ACHIEVEMENTS.filter(
    (a) => !progress.achievements.includes(a.id) && a.condition(progress)
  );
}

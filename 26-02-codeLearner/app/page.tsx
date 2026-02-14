"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { studyItems } from "@/lib/items";
import { buildModules } from "@/lib/courseStructure";
import {
  loadProgress,
  saveProgress,
  completeLesson,
  recordQuizResult,
  getLevel,
} from "@/lib/progress";
import { checkNewAchievements } from "@/lib/gamification";
import type { View, UserProgress, Achievement } from "@/lib/types";
import Dashboard from "./components/Dashboard";
import CourseMap from "./components/CourseMap";
import ModuleView from "./components/ModuleView";
import LessonView from "./components/LessonView";
import QuizView from "./components/QuizView";
import ExploreMode from "./components/ExploreMode";

const NAV_ITEMS: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Home", icon: "\u{1F3E0}" },
  { id: "learn", label: "Learn", icon: "\u{1F4DA}" },
  { id: "practice", label: "Practice", icon: "\u{1F3AF}" },
  { id: "explore", label: "Explore", icon: "\u{1F50D}" },
];

export default function Home() {
  const modules = useMemo(() => buildModules(studyItems), []);
  const [view, setView] = useState<View>("dashboard");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [quizModuleId, setQuizModuleId] = useState<string | undefined>();
  const [progress, setProgress] = useState<UserProgress>(() => loadProgress());
  const [xpPopup, setXpPopup] = useState<{
    amount: number;
    visible: boolean;
  } | null>(null);
  const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(
    null
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (mounted) saveProgress(progress);
  }, [progress, mounted]);

  const showXP = useCallback((amount: number) => {
    setXpPopup({ amount, visible: true });
    setTimeout(() => setXpPopup(null), 1500);
  }, []);

  const processAchievements = useCallback(
    (newProgress: UserProgress) => {
      const newAchievements = checkNewAchievements(newProgress);
      if (newAchievements.length > 0) {
        const updated = {
          ...newProgress,
          achievements: [
            ...newProgress.achievements,
            ...newAchievements.map((a) => a.id),
          ],
          xp:
            newProgress.xp +
            newAchievements.reduce((s, a) => s + a.xpReward, 0),
        };
        setAchievementPopup(newAchievements[0]);
        setTimeout(() => setAchievementPopup(null), 3000);
        return updated;
      }
      return newProgress;
    },
    []
  );

  const handleNavigate = useCallback(
    (targetView: string, param?: string) => {
      if (targetView === "module" && param) {
        setSelectedModuleId(param);
        setView("module");
      } else if (targetView === "lesson" && param) {
        const [modId, lesId] = param.split("|");
        setSelectedModuleId(modId);
        setSelectedLessonId(lesId);
        setView("lesson");
      } else {
        setView(targetView as View);
      }
    },
    []
  );

  const handleLessonComplete = useCallback(
    (lessonId: string, itemIds: string[]) => {
      const prevXP = progress.xp;
      let updated = completeLesson(progress, lessonId, itemIds);
      updated = processAchievements(updated);
      setProgress(updated);
      showXP(updated.xp - prevXP);
    },
    [progress, processAchievements, showXP]
  );

  const handleQuizComplete = useCallback(
    (
      quizId: string,
      correct: number,
      total: number,
      itemResults: { itemId: string; correct: boolean }[]
    ) => {
      const prevXP = progress.xp;
      let updated = recordQuizResult(
        progress,
        quizId,
        correct,
        total,
        itemResults
      );
      updated = processAchievements(updated);
      setProgress(updated);
      showXP(updated.xp - prevXP);
    },
    [progress, processAchievements, showXP]
  );

  const selectedModule = selectedModuleId
    ? modules.find((m) => m.id === selectedModuleId) || null
    : null;
  const selectedLesson =
    selectedModule && selectedLessonId
      ? selectedModule.lessons.find((l) => l.id === selectedLessonId) || null
      : null;

  const level = getLevel(progress.xp);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-shimmer w-48 h-8 rounded-lg bg-surface" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setView("dashboard")}
              className="font-bold text-lg flex items-center gap-2 hover:text-accent transition-colors"
            >
              <span>{"\u{1F4BB}"}</span>
              <span className="hidden sm:inline">Code Learner</span>
            </button>

            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  view === item.id ||
                  (item.id === "learn" &&
                    (view === "module" || view === "lesson")) ||
                  (item.id === "practice" && view === "quiz-active");
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      if (item.id === "learn") {
                        setSelectedModuleId(null);
                        setSelectedLessonId(null);
                      }
                      if (item.id === "practice") {
                        setQuizModuleId(undefined);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "bg-accent-dim text-accent"
                        : "text-text-muted hover:text-text hover:bg-surface"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {progress.streak > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <span>{"\u{1F525}"}</span>
                <span className="text-yellow font-bold">
                  {progress.streak}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-surface rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-gradient-to-r from-accent to-purple rounded-full progress-bar-fill"
                  style={{
                    width: `${Math.min(
                      100,
                      (level.currentXP / level.requiredXP) * 100
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-text-muted">
                Lv.{level.level}
              </span>
              <span className="text-xs font-mono text-xp font-bold">
                {progress.xp} XP
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        {view === "dashboard" && (
          <Dashboard
            progress={progress}
            modules={modules}
            onNavigate={handleNavigate}
          />
        )}

        {view === "learn" && (
          <CourseMap
            modules={modules}
            progress={progress}
            onSelectModule={(id) => {
              setSelectedModuleId(id);
              setView("module");
            }}
          />
        )}

        {view === "module" && selectedModule && (
          <ModuleView
            module={selectedModule}
            progress={progress}
            onBack={() => setView("learn")}
            onSelectLesson={(lessonId) => {
              setSelectedLessonId(lessonId);
              setView("lesson");
            }}
            onStartQuiz={(moduleId) => {
              setQuizModuleId(moduleId);
              setView("quiz-active");
            }}
          />
        )}

        {view === "lesson" && selectedModule && selectedLesson && (
          <LessonView
            lesson={selectedLesson}
            module={selectedModule}
            progress={progress}
            onBack={() => setView("module")}
            onComplete={handleLessonComplete}
            onNextLesson={() => {
              const idx = selectedModule.lessons.findIndex(
                (l) => l.id === selectedLessonId
              );
              if (idx < selectedModule.lessons.length - 1) {
                setSelectedLessonId(selectedModule.lessons[idx + 1].id);
              }
            }}
            hasNext={
              selectedModule.lessons.findIndex(
                (l) => l.id === selectedLessonId
              ) <
              selectedModule.lessons.length - 1
            }
          />
        )}

        {(view === "practice" || view === "quiz-active") && (
          <QuizView
            modules={modules}
            progress={progress}
            initialModuleId={quizModuleId}
            onBack={() => {
              setQuizModuleId(undefined);
              setView("dashboard");
            }}
            onComplete={handleQuizComplete}
          />
        )}

        {view === "explore" && <ExploreMode items={studyItems} />}
      </main>

      {/* XP Popup */}
      {xpPopup?.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="animate-xp-float text-2xl font-bold text-xp drop-shadow-lg">
            +{xpPopup.amount} XP
          </div>
        </div>
      )}

      {/* Achievement Popup */}
      {achievementPopup && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="bg-surface border border-accent/30 rounded-xl p-5 shadow-2xl shadow-accent/10 max-w-xs">
            <div className="text-xs text-accent uppercase tracking-wider mb-1">
              Achievement Unlocked!
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{achievementPopup.icon}</span>
              <div>
                <div className="font-bold">{achievementPopup.title}</div>
                <div className="text-text-muted text-sm">
                  {achievementPopup.description}
                </div>
                <div className="text-xp text-xs font-bold mt-1">
                  +{achievementPopup.xpReward} XP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

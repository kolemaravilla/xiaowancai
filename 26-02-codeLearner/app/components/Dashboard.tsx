"use client";
import type { Module, UserProgress } from "../../lib/types";
import { getLevel } from "../../lib/progress";

interface Props {
  progress: UserProgress;
  modules: Module[];
  onNavigate: (view: string, moduleId?: string) => void;
}

export default function Dashboard({ progress, modules, onNavigate }: Props) {
  const level = getLevel(progress.xp);
  const masteredCount = Object.values(progress.itemMastery).filter(
    (m) => m === "mastered"
  ).length;
  const totalItems = modules.reduce((sum, m) => sum + m.items.length, 0);

  // Find the next incomplete module/lesson
  const nextLesson = (() => {
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        if (!progress.completedLessons.includes(lesson.id)) {
          return { module: mod, lesson };
        }
      }
    }
    return null;
  })();

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface via-surface-active to-accent-dim p-8 mb-8 gradient-border">
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back!
              </h1>
              <p className="text-text-muted text-lg">
                Level {level.level} {level.title}
              </p>
            </div>
            {progress.streak > 0 && (
              <div className="flex items-center gap-2 bg-yellow-dim/50 border border-yellow/20 rounded-xl px-4 py-2 animate-streak">
                <span className="text-2xl">{"\u{1F525}"}</span>
                <div>
                  <div className="text-yellow font-bold text-lg">
                    {progress.streak} day{progress.streak > 1 ? "s" : ""}
                  </div>
                  <div className="text-text-muted text-xs">streak</div>
                </div>
              </div>
            )}
          </div>

          {/* XP Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-muted">
                Level {level.level} &rarr; Level {level.level + 1}
              </span>
              <span className="text-xp font-mono font-bold">
                {progress.xp.toLocaleString()} XP
              </span>
            </div>
            <div className="h-3 bg-bg rounded-full overflow-hidden">
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
            <div className="text-text-dim text-xs mt-1">
              {level.requiredXP - level.currentXP} XP to next level
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Lessons Done"
          value={progress.completedLessons.length}
          total={modules.reduce((s, m) => s + m.lessons.length, 0)}
          color="accent"
          delay={1}
        />
        <StatCard
          label="Items Studied"
          value={progress.totalItemsStudied}
          total={totalItems}
          color="green"
          delay={2}
        />
        <StatCard
          label="Mastered"
          value={masteredCount}
          total={totalItems}
          color="purple"
          delay={3}
        />
        <StatCard
          label="Quizzes Taken"
          value={progress.totalQuizzesTaken}
          color="yellow"
          delay={4}
        />
      </div>

      {/* Continue Learning CTA */}
      {nextLesson && (
        <div className="mb-8 animate-slide-up stagger-3">
          <h2 className="text-lg font-semibold mb-3 text-text-muted">
            Continue Learning
          </h2>
          <button
            onClick={() =>
              onNavigate("lesson", nextLesson.module.id + "|" + nextLesson.lesson.id)
            }
            className="w-full text-left bg-surface hover:bg-surface-hover border border-border hover:border-accent/50 rounded-xl p-5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">{nextLesson.module.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="text-text-muted text-sm">
                  {nextLesson.module.title}
                </div>
                <div className="font-semibold text-lg group-hover:text-accent transition-colors truncate">
                  {nextLesson.lesson.title}
                </div>
                <div className="text-text-dim text-sm mt-1">
                  {nextLesson.lesson.items.length} concepts to learn
                </div>
              </div>
              <div className="text-accent text-2xl group-hover:translate-x-1 transition-transform">
                &rarr;
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Module Progress Grid */}
      <h2 className="text-lg font-semibold mb-3 text-text-muted">
        Your Modules
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {modules.map((mod, i) => {
          const completedLessons = mod.lessons.filter((l) =>
            progress.completedLessons.includes(l.id)
          ).length;
          const pct =
            mod.lessons.length > 0
              ? Math.round((completedLessons / mod.lessons.length) * 100)
              : 0;

          return (
            <button
              key={mod.id}
              onClick={() => onNavigate("module", mod.id)}
              className={`text-left bg-surface hover:bg-surface-hover border border-border hover:border-border-light rounded-xl p-5 transition-all animate-slide-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{mod.title}</div>
                  <div className="text-text-dim text-xs">
                    {mod.items.length} items &middot; {mod.lessons.length}{" "}
                    lessons
                  </div>
                </div>
                {pct === 100 && <span className="text-green">{"\u2713"}</span>}
              </div>
              <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background:
                      pct === 100
                        ? "var(--color-green)"
                        : "var(--color-accent)",
                  }}
                />
              </div>
              <div className="text-text-dim text-xs mt-1">
                {completedLessons}/{mod.lessons.length} lessons &middot; {pct}%
              </div>
            </button>
          );
        })}
      </div>

      {/* Achievements Preview */}
      {progress.achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-text-muted">
            Recent Achievements
          </h2>
          <div className="flex gap-3 flex-wrap">
            {progress.achievements.slice(-5).map((id) => (
              <div
                key={id}
                className="bg-surface border border-border rounded-lg px-4 py-2 text-sm"
              >
                {id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
  delay,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
  delay: number;
}) {
  const colorMap: Record<string, string> = {
    accent: "text-accent",
    green: "text-green",
    purple: "text-purple",
    yellow: "text-yellow",
    cyan: "text-cyan",
  };

  return (
    <div
      className={`bg-surface border border-border rounded-xl p-4 animate-slide-up stagger-${delay}`}
    >
      <div className="text-text-muted text-sm mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${colorMap[color] || "text-accent"}`}>
        {value.toLocaleString()}
        {total !== undefined && (
          <span className="text-text-dim text-sm font-normal">
            /{total}
          </span>
        )}
      </div>
    </div>
  );
}

"use client";
import type { Module, UserProgress } from "../../lib/types";

interface Props {
  module: Module;
  progress: UserProgress;
  onBack: () => void;
  onSelectLesson: (lessonId: string) => void;
  onStartQuiz: (moduleId: string) => void;
}

export default function ModuleView({
  module: mod,
  progress,
  onBack,
  onSelectLesson,
  onStartQuiz,
}: Props) {
  const completedLessons = mod.lessons.filter((l) =>
    progress.completedLessons.includes(l.id)
  ).length;
  const pct =
    mod.lessons.length > 0
      ? Math.round((completedLessons / mod.lessons.length) * 100)
      : 0;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="text-text-muted hover:text-accent text-sm mb-6 flex items-center gap-1 transition-colors"
      >
        &larr; Back to modules
      </button>

      {/* Module Header */}
      <div className="bg-surface border border-border rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-5">
          <span className="text-5xl">{mod.icon}</span>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{mod.title}</h1>
            <p className="text-text-muted mb-4">{mod.description}</p>
            <div className="flex items-center gap-6 text-sm text-text-dim">
              <span>{mod.items.length} concepts</span>
              <span>{mod.lessons.length} lessons</span>
              <span>{pct}% complete</span>
            </div>
            <div className="h-2 bg-bg rounded-full overflow-hidden mt-3">
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
          </div>
        </div>
      </div>

      {/* Quiz CTA */}
      {mod.items.length >= 4 && (
        <button
          onClick={() => onStartQuiz(mod.id)}
          className="w-full bg-accent-dim hover:bg-accent/20 border border-accent/30 rounded-xl p-4 mb-6 flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{"\u{1F3AF}"}</span>
            <div className="text-left">
              <div className="font-semibold group-hover:text-accent transition-colors">
                Test Your Knowledge
              </div>
              <div className="text-text-muted text-sm">
                Take a quiz on {mod.title}
              </div>
            </div>
          </div>
          <span className="text-accent">&rarr;</span>
        </button>
      )}

      {/* Lessons List */}
      <h2 className="text-lg font-semibold text-text-muted mb-4">Lessons</h2>
      <div className="space-y-3">
        {mod.lessons.map((lesson, i) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full text-left rounded-xl border p-5 transition-all group animate-slide-up stagger-${Math.min(i + 1, 6)} ${
                isCompleted
                  ? "bg-green-dim/20 border-green/20 hover:border-green/40"
                  : "bg-surface border-border hover:border-border-light hover:bg-surface-hover"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    isCompleted
                      ? "bg-green/20 text-green"
                      : "bg-border text-text-muted"
                  }`}
                >
                  {isCompleted ? "\u2713" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold group-hover:text-accent transition-colors">
                    {lesson.title}
                  </div>
                  <div className="text-text-dim text-sm mt-0.5 truncate">
                    {lesson.items.map((it) => it.term).join(" \u00B7 ")}
                  </div>
                </div>
                <div className="text-text-dim text-sm shrink-0">
                  {lesson.items.length} items
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

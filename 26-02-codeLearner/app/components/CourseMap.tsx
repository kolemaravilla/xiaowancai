"use client";
import type { Module, UserProgress } from "../../lib/types";

interface Props {
  modules: Module[];
  progress: UserProgress;
  onSelectModule: (moduleId: string) => void;
}

export default function CourseMap({
  modules,
  progress,
  onSelectModule,
}: Props) {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Learning Path</h1>
        <p className="text-text-muted">
          {modules.length} modules covering{" "}
          {modules.reduce((s, m) => s + m.items.length, 0)} concepts across your
          projects
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {modules.map((mod, i) => {
          const completedLessons = mod.lessons.filter((l) =>
            progress.completedLessons.includes(l.id)
          ).length;
          const pct =
            mod.lessons.length > 0
              ? Math.round((completedLessons / mod.lessons.length) * 100)
              : 0;
          const isComplete = pct === 100;
          const isStarted = completedLessons > 0;

          return (
            <button
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className={`group text-left rounded-2xl border transition-all duration-300 hover:scale-[1.02] animate-slide-up stagger-${Math.min(i + 1, 6)} ${
                isComplete
                  ? "bg-green-dim/30 border-green/30 hover:border-green/50"
                  : isStarted
                    ? "bg-surface border-accent/20 hover:border-accent/40"
                    : "bg-surface border-border hover:border-border-light"
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{mod.icon}</span>
                  {isComplete ? (
                    <span className="bg-green/20 text-green text-xs font-medium px-2.5 py-1 rounded-full">
                      Complete
                    </span>
                  ) : isStarted ? (
                    <span className="bg-accent/20 text-accent text-xs font-medium px-2.5 py-1 rounded-full">
                      {pct}%
                    </span>
                  ) : (
                    <span className="bg-border/50 text-text-dim text-xs font-medium px-2.5 py-1 rounded-full">
                      New
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">
                  {mod.title}
                </h3>
                <p className="text-text-muted text-sm mb-4 line-clamp-2">
                  {mod.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-text-dim mb-3">
                  <span>{mod.items.length} items</span>
                  <span>{mod.lessons.length} lessons</span>
                </div>

                <div className="h-1.5 bg-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full progress-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isComplete
                        ? "var(--color-green)"
                        : "var(--color-accent)",
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useState, useCallback } from "react";
import type { Lesson, Module, StudyItem, MasteryLevel } from "../../lib/types";
import { getItemMastery } from "../../lib/progress";
import type { UserProgress } from "../../lib/types";

interface Props {
  lesson: Lesson;
  module: Module;
  progress: UserProgress;
  onBack: () => void;
  onComplete: (lessonId: string, itemIds: string[]) => void;
  onNextLesson: () => void;
  hasNext: boolean;
}

function hasContent(s: string): boolean {
  return !!s && !s.startsWith("Not specified");
}

function MasteryBadge({ level }: { level: MasteryLevel }) {
  const config: Record<MasteryLevel, { label: string; cls: string }> = {
    new: { label: "New", cls: "bg-border text-text-dim" },
    seen: { label: "Seen", cls: "bg-accent-dim text-accent" },
    learning: { label: "Learning", cls: "bg-yellow-dim text-yellow" },
    mastered: { label: "Mastered", cls: "bg-green-dim text-green" },
  };
  const c = config[level];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${c.cls}`}>
      {c.label}
    </span>
  );
}

function KindBadge({ kind, language }: { kind: string; language: string }) {
  const colors: Record<string, string> = {
    concept: "bg-accent-dim text-accent",
    tool: "bg-green-dim text-green",
    command: "bg-yellow-dim text-yellow",
    library: "bg-purple-dim text-purple",
    service: "bg-red-dim text-red",
    pattern: "bg-cyan-dim text-cyan",
    framework: "bg-green-dim text-green",
    "language-feature": "bg-purple-dim text-purple",
  };
  return (
    <div className="flex gap-2 flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full ${colors[kind] || "bg-border text-text-dim"}`}>
        {kind}
      </span>
      {language && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-border text-text-muted">
          {language}
        </span>
      )}
    </div>
  );
}

function ConceptSection({
  title,
  icon,
  content,
  color,
}: {
  title: string;
  icon: string;
  content: string;
  color: string;
}) {
  if (!hasContent(content)) return null;
  return (
    <div className={`border-l-2 pl-4 py-1 ${color}`}>
      <div className="text-sm font-semibold text-text-muted mb-1 flex items-center gap-2">
        <span>{icon}</span> {title}
      </div>
      <p className="text-text leading-relaxed">{content}</p>
    </div>
  );
}

function ConceptCard({
  item,
  index,
  mastery,
}: {
  item: StudyItem;
  index: number;
  mastery: MasteryLevel;
}) {
  const sections = [
    { title: "What It Is", icon: "\u{1F4A1}", content: item.whatItIs, color: "border-accent" },
    { title: "Why It Exists", icon: "\u{1F3AF}", content: item.whyItExists, color: "border-green" },
    { title: "Where It Runs", icon: "\u{1F5A5}\uFE0F", content: item.whereItRuns, color: "border-cyan" },
    { title: "What It Touches", icon: "\u{1F517}", content: item.whatItTouches, color: "border-purple" },
    { title: "What Breaks If It Fails", icon: "\u26A0\uFE0F", content: item.whatBreaks, color: "border-yellow" },
    { title: "Used In Your Project", icon: "\u{1F4E6}", content: item.projectUsage, color: "border-orange" },
    { title: "Common Confusion", icon: "\u{1F914}", content: item.commonConfusion, color: "border-pink" },
  ].filter((s) => hasContent(s.content));

  // Don't show card if the only content is the term repeated
  const meaningfulSections = sections.filter(
    (s) => s.content !== item.term && s.content !== item.definition
  );

  return (
    <div
      className={`bg-surface border border-border rounded-xl overflow-hidden animate-slide-up stagger-${Math.min(index + 1, 6)}`}
    >
      {/* Concept Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold">{item.term}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <MasteryBadge level={mastery} />
          </div>
        </div>
        <KindBadge kind={item.kind} language={item.language} />
        {hasContent(item.definition) &&
          item.definition !== item.term &&
          item.definition !== item.whatItIs && (
            <p className="mt-3 text-text-muted text-lg leading-relaxed">
              {item.definition}
            </p>
          )}
      </div>

      {/* Content Sections */}
      {meaningfulSections.length > 0 ? (
        <div className="p-6 space-y-4">
          {meaningfulSections.map((section) => (
            <ConceptSection key={section.title} {...section} />
          ))}
        </div>
      ) : (
        <div className="p-6">
          <p className="text-text-muted italic">
            This concept is listed in your project's curriculum. Explore it
            further through the quiz to build your understanding.
          </p>
        </div>
      )}
    </div>
  );
}

export default function LessonView({
  lesson,
  module: mod,
  progress,
  onBack,
  onComplete,
  onNextLesson,
  hasNext,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isCompleted, setIsCompleted] = useState(
    progress.completedLessons.includes(lesson.id)
  );
  const [viewMode, setViewMode] = useState<"step" | "all">("step");

  const item = lesson.items[currentIdx];
  const isLast = currentIdx === lesson.items.length - 1;

  const handleComplete = useCallback(() => {
    if (!isCompleted) {
      onComplete(
        lesson.id,
        lesson.items.map((i) => i.id)
      );
      setIsCompleted(true);
    }
  }, [isCompleted, lesson, onComplete]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <button
        onClick={onBack}
        className="text-text-muted hover:text-accent text-sm mb-4 flex items-center gap-1 transition-colors"
      >
        &larr; Back to {mod.title}
      </button>

      <div className="bg-surface border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{mod.icon}</span>
          <div>
            <div className="text-text-dim text-sm">{mod.title}</div>
            <h1 className="text-xl font-bold">{lesson.title}</h1>
          </div>
          {isCompleted && (
            <span className="ml-auto bg-green/20 text-green text-xs font-medium px-3 py-1 rounded-full">
              Completed
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-2 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full progress-bar-fill"
              style={{
                width: `${((currentIdx + 1) / lesson.items.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-text-dim text-sm font-mono">
            {currentIdx + 1}/{lesson.items.length}
          </span>
        </div>

        {/* View toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setViewMode("step")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              viewMode === "step"
                ? "bg-accent text-bg"
                : "bg-border text-text-muted hover:text-text"
            }`}
          >
            Step by step
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              viewMode === "all"
                ? "bg-accent text-bg"
                : "bg-border text-text-muted hover:text-text"
            }`}
          >
            Show all
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "step" ? (
        <div key={item.id} className="animate-scale-in">
          <ConceptCard
            item={item}
            index={0}
            mastery={getItemMastery(progress, item.id)}
          />

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              &larr; Previous
            </button>

            {isLast ? (
              <div className="flex gap-3">
                {!isCompleted && (
                  <button
                    onClick={handleComplete}
                    className="px-6 py-2 rounded-lg bg-green text-bg font-semibold hover:bg-green/80 transition-all animate-pulse-glow"
                  >
                    Complete Lesson (+50 XP)
                  </button>
                )}
                {hasNext && (
                  <button
                    onClick={onNextLesson}
                    className="px-4 py-2 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover transition-all"
                  >
                    Next Lesson &rarr;
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() =>
                  setCurrentIdx((i) =>
                    Math.min(lesson.items.length - 1, i + 1)
                  )
                }
                className="px-6 py-2 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover transition-all"
              >
                Next &rarr;
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {lesson.items.map((it, i) => (
            <ConceptCard
              key={it.id}
              item={it}
              index={i}
              mastery={getItemMastery(progress, it.id)}
            />
          ))}

          {!isCompleted && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleComplete}
                className="px-8 py-3 rounded-xl bg-green text-bg font-semibold text-lg hover:bg-green/80 transition-all animate-pulse-glow"
              >
                Complete Lesson (+50 XP)
              </button>
            </div>
          )}
          {isCompleted && hasNext && (
            <div className="flex justify-center mt-8">
              <button
                onClick={onNextLesson}
                className="px-8 py-3 rounded-xl bg-accent text-bg font-semibold text-lg hover:bg-accent-hover transition-all"
              >
                Next Lesson &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

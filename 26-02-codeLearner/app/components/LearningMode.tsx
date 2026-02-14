"use client";

import { useState, useMemo, useCallback } from "react";
import type { StudyItem } from "@/lib/types";
import { filterOptions } from "@/lib/items";

const NOT_SPECIFIED = "Not specified in the JSON.";

function Section({ label, value }: { label: string; value: string }) {
  const isEmpty = value === NOT_SPECIFIED;
  return (
    <div className="mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p
        className={`mt-0.5 text-sm leading-relaxed ${isEmpty ? "italic text-text-muted/60" : "text-text"}`}
      >
        {value}
      </p>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LearningMode({ items }: { items: StudyItem[] }) {
  const [project, setProject] = useState("");
  const [kind, setKind] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ got: 0, review: 0 });
  const [reviewList, setReviewList] = useState<string[]>([]);
  const [deck, setDeck] = useState<StudyItem[]>(() => shuffle(items));
  const [sessionStarted, setSessionStarted] = useState(false);

  // Rebuild deck when filters change
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (kind && item.kind !== kind) return false;
      if (project && !item.project.toLowerCase().includes(project.toLowerCase()))
        return false;
      return true;
    });
  }, [items, kind, project]);

  const startSession = useCallback(() => {
    const shuffled = shuffle(filteredItems);
    setDeck(shuffled);
    setIndex(0);
    setRevealed(false);
    setScore({ got: 0, review: 0 });
    setReviewList([]);
    setSessionStarted(true);
  }, [filteredItems]);

  const current = deck[index];
  const total = deck.length;
  const progress = total > 0 ? ((index) / total) * 100 : 0;

  const handleGotIt = () => {
    setScore((s) => ({ ...s, got: s.got + 1 }));
    advance();
  };

  const handleReviewAgain = () => {
    if (current) {
      setScore((s) => ({ ...s, review: s.review + 1 }));
      setReviewList((r) => [...r, current.id]);
    }
    advance();
  };

  const advance = () => {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setRevealed(false);
    } else {
      setIndex(total); // marks completion
      setRevealed(false);
    }
  };

  // Session complete screen
  if (sessionStarted && index >= total) {
    const reviewItems = items.filter((i) => reviewList.includes(i.id));
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <h2 className="mb-2 text-xl font-bold text-text">Session Complete</h2>
          <div className="mb-4 flex justify-center gap-6 text-sm">
            <span className="text-green">
              {score.got} got it
            </span>
            <span className="text-yellow">
              {score.review} to review
            </span>
          </div>

          {reviewItems.length > 0 && (
            <div className="mb-4 text-left">
              <p className="mb-2 text-xs font-semibold uppercase text-text-muted">
                Flagged for review:
              </p>
              <div className="flex flex-col gap-1">
                {reviewItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-border bg-bg px-3 py-2 text-xs text-text"
                  >
                    {item.term}
                    <span className="ml-2 text-text-muted">({item.category})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startSession}
            className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-bg hover:bg-accent-hover"
          >
            Start new session
          </button>
        </div>
      </div>
    );
  }

  // Pre-session: filter selection
  if (!sessionStarted) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-bold text-text">
            Set up your study session
          </h2>

          <div className="mb-4 flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-text-muted">
                Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="">All projects</option>
                {filterOptions.projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-text-muted">
                Type
              </label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
              >
                <option value="">All types</option>
                {filterOptions.kinds.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="mb-4 text-sm text-text-muted">
            {filteredItems.length} items in this set
          </p>

          <button
            onClick={startSession}
            disabled={filteredItems.length === 0}
            className="w-full rounded-lg bg-accent px-6 py-3 text-sm font-medium text-bg hover:bg-accent-hover disabled:opacity-40"
          >
            Start studying
          </button>
        </div>
      </div>
    );
  }

  // Active session — flashcard
  if (!current) return null;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-1 flex justify-between text-xs text-text-muted">
          <span>
            {index + 1} of {total}
          </span>
          <span>
            <span className="text-green">{score.got}</span>
            {" / "}
            <span className="text-yellow">{score.review}</span>
          </span>
        </div>
        <div className="h-1 rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-lg border border-border bg-surface">
        {/* Question side — always visible */}
        <div className="p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
              {current.kind}
            </span>
            {current.language && (
              <span className="rounded-full bg-purple/20 px-2 py-0.5 text-[10px] font-bold uppercase text-purple">
                {current.language}
              </span>
            )}
            <span className="text-xs text-text-muted">{current.category}</span>
          </div>
          <h2 className="text-lg font-bold text-text">{current.term}</h2>
          <p className="mt-1 text-xs text-text-muted">{current.project}</p>
        </div>

        {/* Answer side */}
        {!revealed ? (
          <div className="border-t border-border p-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(true);
              }}
              className="w-full rounded-lg border border-border bg-bg py-3 text-sm text-text-muted hover:bg-surface-hover hover:text-text"
            >
              Tap to reveal
            </button>
          </div>
        ) : (
          <div className="border-t border-border p-5">
            <Section label="What it is" value={current.whatItIs} />
            <Section label="Why it exists" value={current.whyItExists} />
            <Section label="Where it runs" value={current.whereItRuns} />
            <Section label="What it touches" value={current.whatItTouches} />
            <Section
              label="What breaks if it fails"
              value={current.whatBreaks}
            />
            <Section
              label="Used in your project"
              value={current.projectUsage}
            />
            <Section label="Common confusion" value={current.commonConfusion} />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleGotIt}
                className="flex-1 rounded-lg bg-green/20 py-3 text-sm font-medium text-green hover:bg-green/30"
              >
                Got it
              </button>
              <button
                onClick={handleReviewAgain}
                className="flex-1 rounded-lg bg-yellow/20 py-3 text-sm font-medium text-yellow hover:bg-yellow/30"
              >
                Review again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back to setup */}
      <button
        onClick={() => setSessionStarted(false)}
        className="mt-4 w-full py-2 text-xs text-text-muted hover:text-text"
      >
        Change filters
      </button>
    </div>
  );
}

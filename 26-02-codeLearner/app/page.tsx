"use client";

import { useState } from "react";
import { studyItems } from "@/lib/items";
import type { Mode } from "@/lib/types";
import ExploreMode from "./components/ExploreMode";
import LearningMode from "./components/LearningMode";

export default function Home() {
  const [mode, setMode] = useState<Mode>("explore");

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <h1 className="text-sm font-bold tracking-tight text-text">
            Code Learner
          </h1>

          {/* Mode toggle */}
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            <button
              onClick={() => setMode("explore")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "explore"
                  ? "bg-accent text-bg"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Explore
            </button>
            <button
              onClick={() => setMode("learn")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === "learn"
                  ? "bg-accent text-bg"
                  : "text-text-muted hover:text-text"
              }`}
            >
              Learn
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {mode === "explore" ? (
          <ExploreMode items={studyItems} />
        ) : (
          <LearningMode items={studyItems} />
        )}
      </main>
    </div>
  );
}

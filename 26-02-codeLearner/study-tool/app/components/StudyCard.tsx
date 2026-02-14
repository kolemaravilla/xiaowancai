"use client";

import { useState } from "react";
import type { StudyItem } from "@/lib/types";

const NOT_SPECIFIED = "Not specified in the JSON.";

function Section({ label, value }: { label: string; value: string }) {
  const isEmpty = value === NOT_SPECIFIED;
  return (
    <div className="mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <p className={`mt-0.5 text-sm leading-relaxed ${isEmpty ? "italic text-text-muted/60" : "text-text"}`}>
        {value}
      </p>
    </div>
  );
}

export default function StudyCard({
  item,
  expanded: controlledExpanded,
  onToggle,
}: {
  item: StudyItem;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggle = onToggle ?? (() => setInternalExpanded((e) => !e));

  const kindColors: Record<string, string> = {
    concept: "bg-accent/20 text-accent",
    tool: "bg-green/20 text-green",
    command: "bg-yellow/20 text-yellow",
    library: "bg-purple/20 text-purple",
    service: "bg-red/20 text-red",
    pattern: "bg-accent/20 text-accent",
    framework: "bg-green/20 text-green",
    "language-feature": "bg-purple/20 text-purple",
  };

  return (
    <div
      className="rounded-lg border border-border bg-surface transition-colors hover:bg-surface-hover cursor-pointer"
      onClick={toggle}
    >
      {/* Header — always visible */}
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-text truncate">
              {item.term}
            </h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${kindColors[item.kind] || "bg-border text-text-muted"}`}
            >
              {item.kind}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-text-muted">
            {item.language && <span>{item.language}</span>}
            {item.language && <span className="text-border">|</span>}
            <span>{item.project}</span>
            <span className="text-border">|</span>
            <span>{item.category}</span>
          </div>
        </div>
        <svg
          className={`mt-1 h-4 w-4 flex-shrink-0 text-text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <Section label="What it is" value={item.whatItIs} />
          <Section label="Why it exists" value={item.whyItExists} />
          <Section label="Where it runs" value={item.whereItRuns} />
          <Section label="What it touches" value={item.whatItTouches} />
          <Section label="What breaks if it fails" value={item.whatBreaks} />
          <Section label="Used in your project" value={item.projectUsage} />
          <Section label="Common confusion" value={item.commonConfusion} />
        </div>
      )}
    </div>
  );
}

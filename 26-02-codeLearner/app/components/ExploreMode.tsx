"use client";

import { useState, useMemo } from "react";
import type { StudyItem } from "@/lib/types";
import { filterOptions } from "@/lib/items";
import StudyCard from "./StudyCard";

export default function ExploreMode({ items }: { items: StudyItem[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((item) => {
      if (q && !item.term.toLowerCase().includes(q) && !item.definition.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false;
      if (kind && item.kind !== kind) return false;
      if (project && !item.project.toLowerCase().includes(project.toLowerCase())) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  }, [items, search, kind, project, category]);

  // Only show categories relevant to current filters
  const visibleCategories = useMemo(() => {
    const q = search.toLowerCase();
    const relevant = items.filter((item) => {
      if (q && !item.term.toLowerCase().includes(q) && !item.definition.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) return false;
      if (kind && item.kind !== kind) return false;
      if (project && !item.project.toLowerCase().includes(project.toLowerCase())) return false;
      return true;
    });
    return [...new Set(relevant.map((i) => i.category))].sort();
  }, [items, search, kind, project]);

  const hasFilters = search || kind || project || category;

  return (
    <div>
      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms, definitions, categories..."
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">All types</option>
          {filterOptions.kinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>

        <select
          value={project}
          onChange={(e) => setProject(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">All projects</option>
          {filterOptions.projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus:border-accent focus:outline-none"
        >
          <option value="">All categories</option>
          {visibleCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setKind("");
              setProject("");
              setCategory("");
            }}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-red hover:bg-surface-hover"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="mb-3 text-xs text-text-muted">
        {filtered.length} of {items.length} items
      </p>

      {/* Card list */}
      <div className="flex flex-col gap-2">
        {filtered.slice(0, 100).map((item) => (
          <StudyCard
            key={item.id}
            item={item}
            expanded={expandedId === item.id}
            onToggle={() =>
              setExpandedId(expandedId === item.id ? null : item.id)
            }
          />
        ))}
        {filtered.length > 100 && (
          <p className="py-4 text-center text-sm text-text-muted">
            Showing first 100 of {filtered.length} results. Use filters to narrow down.
          </p>
        )}
        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-text-muted">
            No items match your filters.
          </p>
        )}
      </div>
    </div>
  );
}

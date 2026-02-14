export interface StudyItem {
  id: string;
  term: string;
  definition: string;
  kind: "concept" | "tool" | "command" | "library" | "service" | "pattern" | "framework" | "language-feature";
  language: string;
  project: string;
  category: string;
  whatItIs: string;
  whyItExists: string;
  whereItRuns: string;
  whatItTouches: string;
  whatBreaks: string;
  projectUsage: string;
  commonConfusion: string;
}

export type FilterState = {
  search: string;
  kind: string;
  project: string;
  category: string;
};

export type Mode = "explore" | "learn";

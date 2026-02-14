import type { StudyItem, Module, Lesson } from "./types";

const MODULE_DEFS: {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  categoryPatterns: string[];
}[] = [
  {
    id: "python-fundamentals",
    title: "Python Fundamentals",
    description: "Core Python concepts, libraries, and command-line tools",
    icon: "\u{1F40D}",
    color: "blue",
    categoryPatterns: [
      "Python Concepts",
      "Python Commands",
      "Python Libraries",
      "Data Processing Python",
    ],
  },
  {
    id: "javascript-deep-dive",
    title: "JavaScript Deep Dive",
    description: "From basics to advanced JS patterns and data formats",
    icon: "\u26A1",
    color: "yellow",
    categoryPatterns: [
      "JavaScript Concepts",
      "Javascript Concepts",
      "Json Concepts",
    ],
  },
  {
    id: "typescript-modern",
    title: "TypeScript & Modern Runtimes",
    description: "Type safety, Deno, and modern JavaScript tooling",
    icon: "\u{1F6E1}\uFE0F",
    color: "blue",
    categoryPatterns: ["TypeScript Concepts", "Deno Concepts", "Languages"],
  },
  {
    id: "web-html-css",
    title: "HTML & CSS",
    description: "Structure, styling, and visual design for the web",
    icon: "\u{1F3A8}",
    color: "pink",
    categoryPatterns: [
      "HTML Concepts",
      "CSS Concepts",
      "Html5 Concepts",
      "Css Concepts",
      "HTML CSS Concepts",
      "Styling",
      "Theming",
      "UI Component Libraries",
    ],
  },
  {
    id: "react-nextjs",
    title: "React & Next.js",
    description: "Component-based UI, server rendering, and mobile with Capacitor",
    icon: "\u269B\uFE0F",
    color: "cyan",
    categoryPatterns: [
      "React Concepts",
      "Next.js Concepts",
      "Capacitor Concepts",
      "Frameworks",
    ],
  },
  {
    id: "bash-cli",
    title: "Bash & Command Line",
    description: "Shell scripting, file management, and system commands",
    icon: "\u{1F4BB}",
    color: "green",
    categoryPatterns: [
      "Bash / Shell Concepts",
      "Bash Commands: File And Navigation",
      "Bash Commands: Networking",
      "Bash Commands: Package Management",
      "Bash Commands: Process And Service",
      "Bash Commands: Ssh",
    ],
  },
  {
    id: "git-github",
    title: "Git & GitHub",
    description: "Version control, collaboration, CI/CD, and automation",
    icon: "\u{1F500}",
    color: "orange",
    categoryPatterns: [
      "Bash Commands: Git",
      "Github Concepts",
      "Git And Github",
      "Git Commands",
      "GitHub Concepts",
      "Github Actions",
      "GitHub Actions Workflows",
      "npm Commands",
    ],
  },
  {
    id: "sql-databases",
    title: "SQL & Databases",
    description: "Relational databases, queries, schema design, and administration",
    icon: "\u{1F5C4}\uFE0F",
    color: "purple",
    categoryPatterns: [
      "SQL Concepts",
      "Sql Concepts",
      "Database Tables",
      "Database Administration",
      "PostgreSQL Concepts",
      "Database Patterns",
      "Database Clients",
      "Database: Analytics",
      "Database: Cached Content",
      "Database: Community Content",
      "Database: Core Content",
      "Database: Lens Feature",
      "Database: Relationships",
      "Database: User Progress",
    ],
  },
  {
    id: "networking-http",
    title: "Networking & HTTP",
    description: "Protocols, REST APIs, and web security fundamentals",
    icon: "\u{1F310}",
    color: "teal",
    categoryPatterns: ["Networking", "Http And Rest", "Security"],
  },
  {
    id: "cloud-infra",
    title: "Cloud & Infrastructure",
    description: "Cloud platforms, CDNs, serverless, and deployment",
    icon: "\u2601\uFE0F",
    color: "sky",
    categoryPatterns: [
      "Oracle Cloud Concepts",
      "Vercel Concepts",
      "Cloudflare Concepts",
      "Cloudflare Commands",
      "Cloudflare R2 Concepts",
      "Infrastructure & Services",
      "Platforms & Infrastructure",
      "Serverless",
      "Cloud Storage",
    ],
  },
  {
    id: "linux-admin",
    title: "Linux Server Admin",
    description: "Server management, processes, and system configuration",
    icon: "\u{1F427}",
    color: "slate",
    categoryPatterns: ["Linux Server Admin"],
  },
  {
    id: "supabase-backend",
    title: "Supabase & Backend Services",
    description: "Backend-as-a-service, auth, storage, and external APIs",
    icon: "\u{1F50C}",
    color: "emerald",
    categoryPatterns: [
      "Supabase Concepts",
      "Authentication & Security",
      "Environment Variables",
      "External Services",
      "External APIs",
      "Configuration Files",
    ],
  },
  {
    id: "software-engineering",
    title: "Software Engineering",
    description: "Design patterns, architecture, and engineering best practices",
    icon: "\u{1F3D7}\uFE0F",
    color: "amber",
    categoryPatterns: [
      "Software Engineering",
      "Design Patterns",
      "Architectural Patterns",
      "Domain Concepts",
    ],
  },
  {
    id: "trading-finance",
    title: "Trading & Finance",
    description: "Market concepts, strategies, risk management, and trading APIs",
    icon: "\u{1F4C8}",
    color: "green",
    categoryPatterns: [
      "Trading: Fundamentals",
      "Trading: Market Regimes",
      "Trading: Orders",
      "Trading: Performance Metrics",
      "Trading: Risk Management",
      "Trading: Strategies Used",
      "Trading: Technical Indicators",
      "Alpaca API",
    ],
  },
  {
    id: "ai-data",
    title: "AI, ML & Data",
    description: "Machine learning concepts, data processing, and analytics",
    icon: "\u{1F916}",
    color: "violet",
    categoryPatterns: [
      "AI And ML",
      "Ai Ml",
      "Analytics",
      "Internationalization",
    ],
  },
  {
    id: "bots-automation",
    title: "Bots & Automation",
    description: "Telegram bots, YAML config, dev tools, and automation",
    icon: "\u{1F916}",
    color: "rose",
    categoryPatterns: [
      "Telegram Bot Api API",
      "Telegram Bot Commands",
      "Yaml Concepts",
      "Dev Tools",
    ],
  },
  {
    id: "lessons-learned",
    title: "Lessons & Best Practices",
    description: "Hard-won lessons from real project experience",
    icon: "\u{1F4A1}",
    color: "yellow",
    categoryPatterns: ["Lessons Learned"],
  },
];

function createLessons(moduleId: string, items: StudyItem[]): Lesson[] {
  const LESSON_SIZE = 5;
  const groups = new Map<string, StudyItem[]>();

  for (const item of items) {
    const key = item.category;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const lessons: Lesson[] = [];
  let order = 0;

  for (const [category, catItems] of groups) {
    for (let i = 0; i < catItems.length; i += LESSON_SIZE) {
      const chunk = catItems.slice(i, i + LESSON_SIZE);
      const part =
        catItems.length > LESSON_SIZE
          ? ` (Part ${Math.floor(i / LESSON_SIZE) + 1})`
          : "";
      lessons.push({
        id: `${moduleId}-lesson-${order}`,
        moduleId,
        title: `${category}${part}`,
        description: chunk.map((it) => it.term).join(", "),
        items: chunk,
        order: order++,
      });
    }
  }

  return lessons;
}

export function buildModules(allItems: StudyItem[]): Module[] {
  const claimed = new Set<string>();

  const modules: Module[] = MODULE_DEFS.map((def) => {
    const items = allItems.filter((item) => {
      if (claimed.has(item.id)) return false;
      if (def.categoryPatterns.includes(item.category)) {
        claimed.add(item.id);
        return true;
      }
      return false;
    });

    const lessons = createLessons(def.id, items);

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      color: def.color,
      categories: def.categoryPatterns,
      items,
      lessons,
    };
  });

  // Catch any unclaimed items into a "More Topics" module
  const unclaimed = allItems.filter((item) => !claimed.has(item.id));
  if (unclaimed.length > 0) {
    const lessons = createLessons("more-topics", unclaimed);
    modules.push({
      id: "more-topics",
      title: "More Topics",
      description: "Additional concepts and tools",
      icon: "\u{1F4DA}",
      color: "gray",
      categories: [...new Set(unclaimed.map((i) => i.category))],
      items: unclaimed,
      lessons,
    });
  }

  return modules.filter((m) => m.items.length > 0);
}

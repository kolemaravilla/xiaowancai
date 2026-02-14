import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const txtPath = join(__dirname, "..", "subject-matter.txt");
const outPath = join(__dirname, "..", "lib", "items.ts");

// --- Read and split the txt file into 3 JSON blocks ---
const raw = readFileSync(txtPath, "utf-8");
const blocks = [];
let currentName = null;
let currentLines = [];

for (const line of raw.split("\n")) {
  const m = line.match(/^Project:\s*(.+)/);
  if (m) {
    if (currentName && currentLines.length) {
      blocks.push({ name: currentName, json: currentLines.join("\n") });
    }
    currentName = m[1].trim();
    currentLines = [];
  } else {
    currentLines.push(line);
  }
}
if (currentName && currentLines.length) {
  blocks.push({ name: currentName, json: currentLines.join("\n") });
}

console.log(`Found ${blocks.length} project blocks: ${blocks.map((b) => b.name).join(", ")}`);

// --- Parse JSON blocks ---
const projects = blocks.map((b) => {
  try {
    return { name: b.name, data: JSON.parse(b.json) };
  } catch (e) {
    console.error(`Failed to parse JSON for ${b.name}:`, e.message);
    process.exit(1);
  }
});

// --- Item extraction ---
let nextId = 1;
const items = [];
const seen = new Set(); // for dedup: "term|language|kind" lowercase

function slug(term, language, kind) {
  return `${term}|${language}|${kind}`.toLowerCase().trim();
}

function addItem(raw) {
  const key = slug(raw.term, raw.language, raw.kind);
  if (seen.has(key)) {
    // merge missing fields into existing
    const existing = items.find(
      (i) => slug(i.term, i.language, i.kind) === key
    );
    if (existing) {
      for (const field of [
        "definition",
        "whyItExists",
        "whereItRuns",
        "whatItTouches",
        "whatBreaks",
        "projectUsage",
        "commonConfusion",
      ]) {
        if (
          (!existing[field] || existing[field].startsWith("Not specified")) &&
          raw[field] &&
          !raw[field].startsWith("Not specified")
        ) {
          existing[field] = raw[field];
        }
      }
      // append project if different
      if (
        raw.project &&
        !existing.project.toLowerCase().includes(raw.project.toLowerCase())
      ) {
        existing.project = existing.project + ", " + raw.project;
      }
    }
    return;
  }
  seen.add(key);
  items.push({ id: `item-${nextId++}`, ...raw });
}

// --- Derive teaching fields from context ---
function deriveWhereItRuns(kind, language, category) {
  if (["bash", "shell"].includes(language?.toLowerCase()))
    return "In a terminal or server shell.";
  if (language?.toLowerCase() === "python") return "On a server or local machine running Python.";
  if (["javascript", "html", "css", "html_css"].includes(language?.toLowerCase()))
    return "In the browser (client-side).";
  if (language?.toLowerCase() === "typescript")
    return "In the browser (after compilation) or on the server via Node.js/Deno.";
  if (language?.toLowerCase() === "sql")
    return "Inside the database engine (PostgreSQL).";
  if (language?.toLowerCase() === "yaml")
    return "Read by automation tools like GitHub Actions.";
  if (kind === "service") return "In the cloud, accessed over the internet.";
  if (kind === "pattern") return "A design approach applied in code architecture.";
  if (category?.toLowerCase().includes("networking"))
    return "Over the network between client and server.";
  if (category?.toLowerCase().includes("linux") || category?.toLowerCase().includes("server"))
    return "On a Linux server.";
  return "Not specified in the JSON.";
}

function deriveProjectUsage(project, term, usedFor) {
  if (usedFor) return `In ${project}: ${usedFor}`;
  return `Used in the ${project} project.`;
}

// ============= STREAMCROSSER =============
function extractStreamcrosser(data, project) {
  // Languages
  if (data.languages) {
    // Python
    const py = data.languages.python;
    if (py) {
      (py.concepts || []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "Python",
          project,
          category: "Python Concepts",
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "On a server or local machine running Python.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}'s Python backend.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
      if (py.libraries) {
        for (const [name, desc] of Object.entries(py.libraries)) {
          addItem({
            term: name,
            definition: desc,
            kind: "library",
            language: "Python",
            project,
            category: "Python Libraries",
            whatItIs: desc,
            whyItExists: `Provides specific functionality so you don't have to build it from scratch.`,
            whereItRuns: "On a server or local machine running Python.",
            whatItTouches: "The backend processing pipeline.",
            whatBreaks: "Not specified in the JSON.",
            projectUsage: deriveProjectUsage(project, name, null),
            commonConfusion: "Not specified in the JSON.",
          });
        }
      }
      (py.commands || []).forEach((cmd) => {
        addItem({
          term: cmd,
          definition: `Python/pip command used during development or deployment.`,
          kind: "command",
          language: "Python",
          project,
          category: "Python Commands",
          whatItIs: `A terminal command: ${cmd}`,
          whyItExists: "To manage Python environments and packages.",
          whereItRuns: "In a terminal on the server or local machine.",
          whatItTouches: "The Python environment and installed packages.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project} to set up and run the Python backend.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }

    // HTML/CSS/JS
    const hcj = data.languages.html_css_javascript;
    if (hcj) {
      for (const [groupKey, groupLabel, lang] of [
        ["html_concepts", "HTML Concepts", "HTML"],
        ["css_concepts", "CSS Concepts", "CSS"],
        ["javascript_concepts", "JavaScript Concepts", "JavaScript"],
      ]) {
        (hcj[groupKey] || []).forEach((c) => {
          const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
          addItem({
            term,
            definition: desc || term,
            kind: "concept",
            language: lang,
            project,
            category: groupLabel,
            whatItIs: desc || term,
            whyItExists: "Not specified in the JSON.",
            whereItRuns: lang === "JavaScript" ? "In the browser." : "Rendered by the browser.",
            whatItTouches: "The user interface the visitor sees and interacts with.",
            whatBreaks: "Not specified in the JSON.",
            projectUsage: `Used in ${project}'s frontend.`,
            commonConfusion: "Not specified in the JSON.",
          });
        });
      }
    }

    // Bash
    const bash = data.languages.bash_shell;
    if (bash) {
      (bash.concepts || []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "Bash",
          project,
          category: "Bash / Shell Concepts",
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "In a terminal or server shell.",
          whatItTouches: "The operating system and file system.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project} for server administration.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
      if (bash.commands) {
        for (const [group, cmds] of Object.entries(bash.commands)) {
          const groupLabel = group.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
          (Array.isArray(cmds) ? cmds : []).forEach((c) => {
            const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
            addItem({
              term,
              definition: desc || term,
              kind: "command",
              language: "Bash",
              project,
              category: `Bash Commands: ${groupLabel}`,
              whatItIs: `A terminal command: ${term}. ${desc || ""}`,
              whyItExists: "Not specified in the JSON.",
              whereItRuns: "In a terminal or server shell.",
              whatItTouches: "Not specified in the JSON.",
              whatBreaks: "Not specified in the JSON.",
              projectUsage: `Used in ${project} for server management and deployment.`,
              commonConfusion: "Not specified in the JSON.",
            });
          });
        }
      }
    }
  }

  // Infrastructure & services
  if (data.infrastructure_and_services) {
    for (const [key, svc] of Object.entries(data.infrastructure_and_services)) {
      const name = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      addItem({
        term: name,
        definition: svc.what || `Infrastructure service: ${name}`,
        kind: "service",
        language: "",
        project,
        category: "Infrastructure & Services",
        whatItIs: svc.what || name,
        whyItExists: svc.used_for ? `To handle: ${svc.used_for}` : "Not specified in the JSON.",
        whereItRuns: "In the cloud, accessed over the internet.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: svc.used_for ? `In ${project}: ${svc.used_for}` : `Used in ${project}.`,
        commonConfusion: "Not specified in the JSON.",
      });
      (svc.concepts || []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: `${name} Concepts`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("service", "", key),
          whatItTouches: `Part of the ${name} infrastructure.`,
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}'s ${name} setup.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
      // Cloudflare commands
      (svc.commands || []).forEach((cmd) => {
        addItem({
          term: cmd,
          definition: `${name} CLI command.`,
          kind: "command",
          language: "Bash",
          project,
          category: `${name} Commands`,
          whatItIs: `A terminal command for ${name}: ${cmd}`,
          whyItExists: `To configure and manage ${name}.`,
          whereItRuns: "In a terminal or server shell.",
          whatItTouches: `${name} service configuration.`,
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project} to set up ${name}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Key concepts
  if (data.key_concepts) {
    for (const [cat, conceptList] of Object.entries(data.key_concepts)) {
      const catLabel = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      (Array.isArray(conceptList) ? conceptList : []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: catLabel,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("concept", "", cat),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Referenced in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Lessons
  if (data.problems_solved_and_lessons) {
    data.problems_solved_and_lessons.forEach((lesson) => {
      const [term, desc] = lesson.includes("—") ? lesson.split("—").map((s) => s.trim()) : [lesson.slice(0, 50), lesson];
      addItem({
        term,
        definition: desc || lesson,
        kind: "concept",
        language: "",
        project,
        category: "Lessons Learned",
        whatItIs: desc || lesson,
        whyItExists: "A real problem encountered during development that taught an important lesson.",
        whereItRuns: "Not specified in the JSON.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: desc || lesson,
        projectUsage: `Encountered while building ${project}. ${lesson}`,
        commonConfusion: desc || lesson,
      });
    });
  }
}

// ============= MONEY PRINTER =============
function extractMoneyPrinter(data, project) {
  // Languages
  if (data.languages) {
    for (const [langKey, langData] of Object.entries(data.languages)) {
      const lang = langKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const concepts = langData.concepts_used || langData.concepts || [];
      concepts.forEach((c) => {
        const [term, desc] = c.includes("(") ? [c.split("(")[0].trim(), c] : c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: lang,
          project,
          category: `${lang} Concepts`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("concept", langKey, ""),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: langData.role ? `In ${project}: ${langData.role}` : `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });

      // Libraries
      const libs = langData.key_libraries || {};
      for (const [name, desc] of Object.entries(libs)) {
        addItem({
          term: name,
          definition: desc,
          kind: "library",
          language: lang,
          project,
          category: `${lang} Libraries`,
          whatItIs: desc,
          whyItExists: "Provides specific functionality so you don't have to build it from scratch.",
          whereItRuns: deriveWhereItRuns("library", langKey, ""),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
    }
  }

  // External services
  if (data.external_services) {
    for (const [key, svc] of Object.entries(data.external_services)) {
      const name = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      addItem({
        term: name,
        definition: svc.what || name,
        kind: "service",
        language: "",
        project,
        category: "External Services",
        whatItIs: svc.what || name,
        whyItExists: svc.role_in_project ? svc.role_in_project : "Not specified in the JSON.",
        whereItRuns: "In the cloud, accessed via API.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: svc.role_in_project ? `In ${project}: ${svc.role_in_project}` : `Used in ${project}.`,
        commonConfusion: "Not specified in the JSON.",
      });

      // Service endpoints
      (svc.endpoints_used || []).forEach((ep) => {
        const [term, desc] = ep.includes("—") ? ep.split("—").map((s) => s.trim()) : [ep, ep];
        addItem({
          term: `${name}: ${term}`,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: `${name} API`,
          whatItIs: `An API endpoint: ${desc || term}`,
          whyItExists: `Lets your code interact with ${name}.`,
          whereItRuns: "Over the network — your code sends a request, the service responds.",
          whatItTouches: `${name} service.`,
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project} to interact with ${name}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });

      // Telegram commands
      (svc.commands_implemented || []).forEach((cmd) => {
        addItem({
          term: `Telegram ${cmd.split("—")[0].trim()}`,
          definition: cmd.includes("—") ? cmd.split("—")[1].trim() : cmd,
          kind: "command",
          language: "",
          project,
          category: "Telegram Bot Commands",
          whatItIs: `A Telegram bot command: ${cmd}`,
          whyItExists: "Lets you control the trading bot remotely from your phone.",
          whereItRuns: "Sent via Telegram; processed by the bot's listener script.",
          whatItTouches: "The trading bot's state and operations.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `In ${project}: remote control of the trading bot.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });

      // Supabase tables
      (svc.tables || []).forEach((t) => {
        const [term, desc] = t.includes("—") ? t.split("—").map((s) => s.trim()) : [t, t];
        addItem({
          term: `Table: ${term}`,
          definition: desc || term,
          kind: "concept",
          language: "SQL",
          project,
          category: "Database Tables",
          whatItIs: `A database table: ${desc || term}`,
          whyItExists: "Stores structured data that the application reads and writes.",
          whereItRuns: "Inside the PostgreSQL database (Supabase).",
          whatItTouches: "The bot's data — read by the dashboard, written by the trading logic.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `In ${project}: ${desc || term}`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Architecture patterns
  if (data.architecture_and_design_patterns?.patterns) {
    data.architecture_and_design_patterns.patterns.forEach((p) => {
      addItem({
        term: p.name,
        definition: p.what,
        kind: "pattern",
        language: "",
        project,
        category: "Design Patterns",
        whatItIs: p.what,
        whyItExists: "A proven solution to a recurring design problem in software.",
        whereItRuns: "A design approach applied in code architecture.",
        whatItTouches: p.where ? `Found in: ${p.where}` : "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: p.where ? `In ${project}, found in ${p.where}: ${p.what}` : `Used in ${project}.`,
        commonConfusion: "Not specified in the JSON.",
      });
    });
  }

  // Trading concepts
  if (data.trading_concepts) {
    for (const [cat, list] of Object.entries(data.trading_concepts)) {
      const catLabel = "Trading: " + cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      (Array.isArray(list) ? list : []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: catLabel,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "Applies to stock market trading logic.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}'s trading logic.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Infrastructure concepts
  if (data.infrastructure_concepts) {
    for (const [cat, list] of Object.entries(data.infrastructure_concepts)) {
      const catLabel = cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      (Array.isArray(list) ? list : []).forEach((c) => {
        const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: catLabel,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("concept", "", cat),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Referenced in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Security concepts
  if (data.security_concepts && Array.isArray(data.security_concepts)) {
    data.security_concepts.forEach((c) => {
      const [term, desc] = c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
      addItem({
        term,
        definition: desc || term,
        kind: "concept",
        language: "",
        project,
        category: "Security",
        whatItIs: desc || term,
        whyItExists: "Protects the application and its users from unauthorized access.",
        whereItRuns: "Not specified in the JSON.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: `Applied in ${project}.`,
        commonConfusion: "Not specified in the JSON.",
      });
    });
  }
}

// ============= NUVOKA =============
function extractNuvoka(data, project) {
  // Languages
  if (data.languages) {
    for (const [langKey, langData] of Object.entries(data.languages)) {
      const lang = langKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      // Add the language itself as an item
      if (langData.what) {
        addItem({
          term: lang,
          definition: langData.what,
          kind: "language-feature",
          language: lang,
          project,
          category: "Languages",
          whatItIs: langData.what,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("language-feature", langKey, ""),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: langData.used_for ? `In ${project}: ${Array.isArray(langData.used_for) ? langData.used_for.join(", ") : langData.used_for}` : `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
      (langData.key_concepts || []).forEach((c) => {
        const [term, desc] = c.includes(" - ") ? c.split(" - ").map((s) => s.trim()) : c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: lang,
          project,
          category: `${lang} Concepts`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("concept", langKey, ""),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Frameworks
  if (data.frameworks) {
    for (const [name, fw] of Object.entries(data.frameworks)) {
      const fwName = name.replace(/_/g, " ");
      if (fw.what) {
        addItem({
          term: fwName,
          definition: fw.what,
          kind: "framework",
          language: "",
          project,
          category: "Frameworks",
          whatItIs: fw.what,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("framework", "", name),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: fw.used_for ? `In ${project}: ${fw.used_for}` : `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
      (fw.key_concepts || []).forEach((c) => {
        const [term, desc] = c.includes(" - ") ? c.split(" - ").map((s) => s.trim()) : c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: `${fwName} Concepts`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: deriveWhereItRuns("concept", "", name),
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}'s ${fwName} layer.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Platforms & infrastructure
  if (data.platforms_and_infrastructure) {
    for (const [name, plat] of Object.entries(data.platforms_and_infrastructure)) {
      const platName = name.replace(/_/g, " ");
      if (plat.what) {
        addItem({
          term: platName,
          definition: plat.what,
          kind: "service",
          language: "",
          project,
          category: "Platforms & Infrastructure",
          whatItIs: plat.what,
          whyItExists: plat.used_for ? plat.used_for : "Not specified in the JSON.",
          whereItRuns: "In the cloud.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: plat.used_for ? `In ${project}: ${plat.used_for}` : `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
      (plat.key_concepts || []).forEach((c) => {
        const [term, desc] = c.includes(" - ") ? c.split(" - ").map((s) => s.trim()) : c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "concept",
          language: "",
          project,
          category: `${platName} Concepts`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "In the cloud or infrastructure layer.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}'s ${platName} setup.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });

      // Workflows
      (plat.workflows || []).forEach((wf) => {
        addItem({
          term: wf.file,
          definition: wf.purpose,
          kind: "tool",
          language: "YAML",
          project,
          category: "GitHub Actions Workflows",
          whatItIs: `A GitHub Actions workflow file: ${wf.purpose}`,
          whyItExists: "Automates a task that would otherwise require manual work.",
          whereItRuns: "On a GitHub-hosted virtual machine (runner).",
          whatItTouches: "The codebase, database, or deployment targets.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `In ${project}: ${wf.purpose}`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Libraries by category
  if (data.libraries_by_category) {
    for (const [catKey, catData] of Object.entries(data.libraries_by_category)) {
      const catName = catKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      for (const [libKey, libData] of Object.entries(catData)) {
        const libName = libKey.replace(/_/g, " ");
        if (typeof libData === "object" && libData.what) {
          addItem({
            term: libName,
            definition: libData.what,
            kind: "library",
            language: "",
            project,
            category: catName,
            whatItIs: libData.what,
            whyItExists: "Not specified in the JSON.",
            whereItRuns: "Not specified in the JSON.",
            whatItTouches: "Not specified in the JSON.",
            whatBreaks: "Not specified in the JSON.",
            projectUsage: libData.used_for ? `In ${project}: ${libData.used_for}` : `Used in ${project}.`,
            commonConfusion: "Not specified in the JSON.",
          });
        }
      }
    }
  }

  // Dev tools
  if (data.dev_tools) {
    for (const [name, tool] of Object.entries(data.dev_tools)) {
      const toolName = name.replace(/_/g, " ");
      if (tool.what) {
        addItem({
          term: toolName,
          definition: tool.what,
          kind: "tool",
          language: "",
          project,
          category: "Dev Tools",
          whatItIs: tool.what,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "On your local machine or in a CI environment.",
          whatItTouches: "Your codebase and development workflow.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
      // Git commands etc
      (tool.key_commands || tool.key_files || []).forEach((c) => {
        const [term, desc] = c.includes(" - ") ? c.split(" - ").map((s) => s.trim()) : c.includes("—") ? c.split("—").map((s) => s.trim()) : [c, c];
        addItem({
          term,
          definition: desc || term,
          kind: "command",
          language: "",
          project,
          category: `${toolName} Commands`,
          whatItIs: desc || term,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "In a terminal.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      });
    }
  }

  // Architectural patterns
  if (data.architectural_patterns) {
    for (const [name, pat] of Object.entries(data.architectural_patterns)) {
      const patName = name.replace(/_/g, " ");
      if (pat.what) {
        addItem({
          term: patName,
          definition: pat.what,
          kind: "pattern",
          language: "",
          project,
          category: "Architectural Patterns",
          whatItIs: pat.what,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: pat.where ? `Found in: ${pat.where}` : "A design approach applied in code architecture.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: pat.where ? `In ${project}: ${pat.where}` : `Used in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
    }
  }

  // Auth & security
  if (data.authentication_and_security?.concepts) {
    data.authentication_and_security.concepts.forEach((c) => {
      addItem({
        term: c.term,
        definition: c.what,
        kind: "concept",
        language: "",
        project,
        category: "Authentication & Security",
        whatItIs: c.what,
        whyItExists: "Protects the application and its users from unauthorized access.",
        whereItRuns: "Not specified in the JSON.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: `Applied in ${project}.`,
        commonConfusion: "Not specified in the JSON.",
      });
    });
  }

  // Domain concepts
  if (data.project_specific_domain_concepts) {
    for (const [key, concept] of Object.entries(data.project_specific_domain_concepts)) {
      const name = concept.full_name || key.replace(/_/g, " ");
      if (concept.what) {
        addItem({
          term: name,
          definition: concept.what,
          kind: "concept",
          language: "",
          project,
          category: "Domain Concepts",
          whatItIs: concept.what,
          whyItExists: "Not specified in the JSON.",
          whereItRuns: "Not specified in the JSON.",
          whatItTouches: "Not specified in the JSON.",
          whatBreaks: "Not specified in the JSON.",
          projectUsage: `Core concept in ${project}.`,
          commonConfusion: "Not specified in the JSON.",
        });
      }
    }
  }

  // Database schema concepts
  if (data.database_schema_concepts) {
    // Key patterns
    (data.database_schema_concepts.key_patterns || []).forEach((p) => {
      const [term, desc] = p.includes(" - ") ? p.split(" - ").map((s) => s.trim()) : [p, p];
      addItem({
        term,
        definition: desc || term,
        kind: "concept",
        language: "SQL",
        project,
        category: "Database Patterns",
        whatItIs: desc || term,
        whyItExists: "Not specified in the JSON.",
        whereItRuns: "Inside the PostgreSQL database.",
        whatItTouches: "Not specified in the JSON.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: `Used in ${project}'s database.`,
        commonConfusion: "Not specified in the JSON.",
      });
    });

    // Tables
    if (data.database_schema_concepts.tables) {
      for (const [group, tables] of Object.entries(data.database_schema_concepts.tables)) {
        const groupLabel = group.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        for (const [name, desc] of Object.entries(tables)) {
          addItem({
            term: `Table: ${name}`,
            definition: desc,
            kind: "concept",
            language: "SQL",
            project,
            category: `Database: ${groupLabel}`,
            whatItIs: `A database table: ${desc}`,
            whyItExists: "Stores structured data that the application reads and writes.",
            whereItRuns: "Inside the PostgreSQL database (Supabase).",
            whatItTouches: "The application's data layer.",
            whatBreaks: "Not specified in the JSON.",
            projectUsage: `In ${project}: ${desc}`,
            commonConfusion: "Not specified in the JSON.",
          });
        }
      }
    }
  }

  // Config files
  if (data.configuration_files_reference?.files) {
    data.configuration_files_reference.files.forEach((f) => {
      addItem({
        term: f.file,
        definition: f.what,
        kind: "tool",
        language: "",
        project,
        category: "Configuration Files",
        whatItIs: `A configuration file: ${f.what}`,
        whyItExists: "Separates settings from code so behavior can be changed without editing source files.",
        whereItRuns: "Read by build tools, frameworks, or deployment platforms.",
        whatItTouches: "How the project builds, runs, or deploys.",
        whatBreaks: "Not specified in the JSON.",
        projectUsage: `Used in ${project} for project configuration.`,
        commonConfusion: "Not specified in the JSON.",
      });
    });
  }
}

// --- Run extraction ---
for (const { name, data } of projects) {
  if (name === "Streamcrosser") extractStreamcrosser(data, name);
  else if (name === "Money Printer") extractMoneyPrinter(data, name);
  else if (name === "NuVoKa") extractNuvoka(data, name);
}

console.log(`Extracted ${items.length} items total`);

// --- Collect filter options ---
const kinds = [...new Set(items.map((i) => i.kind))].sort();
const projectNames = [...new Set(items.flatMap((i) => i.project.split(", ")))].sort();
const categories = [...new Set(items.map((i) => i.category))].sort();

// --- Write output ---
const output = `// AUTO-GENERATED by scripts/parse-data.mjs — do not edit manually
import type { StudyItem } from "./types";

export const studyItems: StudyItem[] = ${JSON.stringify(items, null, 2)};

export const filterOptions = {
  kinds: ${JSON.stringify(kinds)},
  projects: ${JSON.stringify(projectNames)},
  categories: ${JSON.stringify(categories)},
};
`;

writeFileSync(outPath, output, "utf-8");
console.log(`Wrote ${items.length} items to ${outPath}`);
console.log(`Kinds: ${kinds.join(", ")}`);
console.log(`Projects: ${projectNames.join(", ")}`);
console.log(`Categories: ${categories.length} unique`);

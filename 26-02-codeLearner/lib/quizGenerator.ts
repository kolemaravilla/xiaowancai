import type { StudyItem, QuizQuestion } from "./types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hasContent(s: string): boolean {
  return !!s && !s.startsWith("Not specified");
}

function pickDistractors(
  correct: StudyItem,
  pool: StudyItem[],
  count: number
): StudyItem[] {
  const candidates = pool.filter(
    (item) =>
      item.id !== correct.id &&
      hasContent(item.whatItIs) &&
      item.whatItIs !== item.term
  );
  return shuffle(candidates).slice(0, count);
}

function getDescription(item: StudyItem): string {
  if (hasContent(item.whatItIs) && item.whatItIs !== item.term)
    return item.whatItIs;
  if (hasContent(item.definition) && item.definition !== item.term)
    return item.definition;
  return item.term;
}

export function generateMultipleChoice(
  item: StudyItem,
  allItems: StudyItem[]
): QuizQuestion | null {
  const desc = getDescription(item);
  if (desc === item.term) return null;

  const distractors = pickDistractors(item, allItems, 3);
  if (distractors.length < 3) return null;

  const options = [desc, ...distractors.map((d) => getDescription(d))];
  const shuffled = shuffle(options.map((o, i) => ({ text: o, wasCorrect: i === 0 })));
  const correctIdx = shuffled.findIndex((o) => o.wasCorrect);

  return {
    id: `mc-${item.id}`,
    type: "multiple-choice",
    question: `What is "${item.term}"?`,
    options: shuffled.map((o) => o.text),
    correctAnswer: correctIdx,
    explanation: desc,
    itemId: item.id,
  };
}

export function generateTrueFalse(
  item: StudyItem,
  allItems: StudyItem[]
): QuizQuestion | null {
  const desc = getDescription(item);
  if (desc === item.term) return null;

  const showTrue = Math.random() > 0.5;

  if (showTrue) {
    return {
      id: `tf-${item.id}`,
      type: "true-false",
      question: `True or False: "${item.term}" is ${desc.toLowerCase().endsWith(".") ? desc : desc + "."}`,
      correctAnswer: true,
      explanation: `Correct! ${item.term} is ${desc}.`,
      itemId: item.id,
    };
  }

  const distractors = pickDistractors(item, allItems, 1);
  if (distractors.length < 1) return null;
  const wrongDesc = getDescription(distractors[0]);

  return {
    id: `tf-${item.id}`,
    type: "true-false",
    question: `True or False: "${item.term}" is ${wrongDesc.toLowerCase().endsWith(".") ? wrongDesc : wrongDesc + "."}`,
    correctAnswer: false,
    explanation: `False. ${item.term} is actually ${desc}.`,
    itemId: item.id,
  };
}

export function generateQuiz(
  items: StudyItem[],
  allItems: StudyItem[],
  count: number = 10
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const pool = shuffle(items);

  for (const item of pool) {
    if (questions.length >= count) break;

    const gen =
      Math.random() > 0.4
        ? generateMultipleChoice(item, allItems)
        : generateTrueFalse(item, allItems);

    if (gen) questions.push(gen);
  }

  return shuffle(questions);
}

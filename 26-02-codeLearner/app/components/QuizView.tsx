"use client";
import { useState, useMemo, useCallback } from "react";
import type { Module, QuizQuestion, UserProgress } from "../../lib/types";
import { generateQuiz } from "../../lib/quizGenerator";
import { studyItems } from "../../lib/items";

interface Props {
  modules: Module[];
  progress: UserProgress;
  initialModuleId?: string;
  onBack: () => void;
  onComplete: (
    quizId: string,
    correct: number,
    total: number,
    itemResults: { itemId: string; correct: boolean }[]
  ) => void;
}

type Phase = "setup" | "active" | "results";

export default function QuizView({
  modules,
  progress,
  initialModuleId,
  onBack,
  onComplete,
}: Props) {
  const [phase, setPhase] = useState<Phase>(initialModuleId ? "active" : "setup");
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId || "");
  const [questionCount, setQuestionCount] = useState(10);

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  const [questions, setQuestions] = useState<QuizQuestion[]>(() => {
    if (initialModuleId) {
      const mod = modules.find((m) => m.id === initialModuleId);
      if (mod) return generateQuiz(mod.items, studyItems, 10);
    }
    return [];
  });
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(
    null
  );
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<
    { itemId: string; correct: boolean; question: string }[]
  >([]);

  const startQuiz = useCallback(() => {
    if (!selectedModule) return;
    const qs = generateQuiz(selectedModule.items, studyItems, questionCount);
    if (qs.length === 0) return;
    setQuestions(qs);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setResults([]);
    setPhase("active");
  }, [selectedModule, questionCount]);

  const submitAnswer = useCallback(() => {
    if (selectedAnswer === null) return;
    const q = questions[currentQ];
    const isCorrect = selectedAnswer === q.correctAnswer;
    setResults((prev) => [
      ...prev,
      { itemId: q.itemId, correct: isCorrect, question: q.question },
    ]);
    setShowResult(true);
  }, [selectedAnswer, questions, currentQ]);

  const nextQuestion = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      const correct = results.length > 0
        ? results.filter((r) => r.correct).length +
          (selectedAnswer === questions[currentQ].correctAnswer ? 1 : 0)
        : selectedAnswer === questions[currentQ].correctAnswer
          ? 1
          : 0;

      // Build final results including current
      const q = questions[currentQ];
      const finalResults = [
        ...results,
      ];
      // The current question's result was already added via submitAnswer's setResults

      const total = questions.length;
      const quizId = `quiz-${selectedModuleId}-${Date.now()}`;
      onComplete(quizId, finalResults.filter(r => r.correct).length, total, finalResults);
      setPhase("results");
    }
  }, [currentQ, questions, results, selectedAnswer, selectedModuleId, onComplete]);

  const correctCount = results.filter((r) => r.correct).length;
  const score =
    results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;

  // Setup screen
  if (phase === "setup") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-accent text-sm mb-6 flex items-center gap-1 transition-colors"
        >
          &larr; Back
        </button>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <span>{"\u{1F3AF}"}</span> Quiz Time
          </h1>
          <p className="text-text-muted mb-6">
            Test your knowledge with multiple choice and true/false questions.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Choose a module
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {modules
                  .filter((m) => m.items.length >= 4)
                  .map((mod) => (
                    <button
                      key={mod.id}
                      onClick={() => setSelectedModuleId(mod.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedModuleId === mod.id
                          ? "border-accent bg-accent-dim"
                          : "border-border hover:border-border-light bg-bg"
                      }`}
                    >
                      <span className="mr-2">{mod.icon}</span>
                      <span className="text-sm">{mod.title}</span>
                      <span className="text-text-dim text-xs ml-1">
                        ({mod.items.length})
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Number of questions
              </label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-4 py-2 rounded-lg border transition-all ${
                      questionCount === n
                        ? "border-accent bg-accent-dim text-accent"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {selectedModule && (
              <div className="text-sm text-text-dim">
                {progress.quizHighScores[`quiz-${selectedModuleId}`]
                  ? `Best score: ${progress.quizHighScores[`quiz-${selectedModuleId}`]}%`
                  : "No previous attempts"}
              </div>
            )}

            <button
              onClick={startQuiz}
              disabled={!selectedModule}
              className="w-full py-3 rounded-xl bg-accent text-bg font-semibold text-lg hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active quiz
  if (phase === "active" && questions.length > 0) {
    const q = questions[currentQ];

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-text-muted mb-2">
            <span>
              Question {currentQ + 1} of {questions.length}
            </span>
            <span>
              {correctCount}/{results.length} correct
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full progress-bar-fill"
              style={{
                width: `${((currentQ + 1) / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div
          key={q.id}
          className="bg-surface border border-border rounded-2xl p-8 animate-scale-in"
        >
          <div className="text-xs text-text-dim uppercase tracking-wider mb-2">
            {q.type === "multiple-choice" ? "Multiple Choice" : "True or False"}
          </div>
          <h2 className="text-xl font-semibold mb-6 leading-relaxed">
            {q.question}
          </h2>

          {q.type === "multiple-choice" && q.options && (
            <div className="space-y-3">
              {q.options.map((opt, i) => {
                let cls =
                  "border-border hover:border-border-light bg-bg hover:bg-surface-hover";
                if (showResult) {
                  if (i === q.correctAnswer)
                    cls = "quiz-correct";
                  else if (i === selectedAnswer && i !== q.correctAnswer)
                    cls = "quiz-incorrect";
                  else cls = "border-border bg-bg opacity-50";
                } else if (selectedAnswer === i) {
                  cls = "border-accent bg-accent-dim";
                }

                return (
                  <button
                    key={i}
                    onClick={() => !showResult && setSelectedAnswer(i)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${cls}`}
                  >
                    <span className="text-text-dim mr-3 font-mono text-sm">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "true-false" && (
            <div className="flex gap-4">
              {[true, false].map((val) => {
                let cls =
                  "border-border hover:border-border-light bg-bg hover:bg-surface-hover";
                if (showResult) {
                  if (val === q.correctAnswer)
                    cls = "quiz-correct";
                  else if (val === selectedAnswer && val !== q.correctAnswer)
                    cls = "quiz-incorrect";
                  else cls = "border-border bg-bg opacity-50";
                } else if (selectedAnswer === val) {
                  cls = "border-accent bg-accent-dim";
                }

                return (
                  <button
                    key={String(val)}
                    onClick={() => !showResult && setSelectedAnswer(val)}
                    disabled={showResult}
                    className={`flex-1 p-4 rounded-xl border text-center font-semibold text-lg transition-all ${cls}`}
                  >
                    {val ? "True" : "False"}
                  </button>
                );
              })}
            </div>
          )}

          {/* Explanation */}
          {showResult && (
            <div className="mt-6 p-4 rounded-lg bg-bg border border-border animate-slide-up">
              <div
                className={`font-semibold mb-1 ${
                  selectedAnswer === q.correctAnswer
                    ? "text-green"
                    : "text-red"
                }`}
              >
                {selectedAnswer === q.correctAnswer
                  ? "\u2713 Correct!"
                  : "\u2717 Incorrect"}
              </div>
              <p className="text-text-muted text-sm">{q.explanation}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-6 flex justify-end">
            {!showResult ? (
              <button
                onClick={submitAnswer}
                disabled={selectedAnswer === null}
                className="px-6 py-2.5 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                className="px-6 py-2.5 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover transition-all"
              >
                {currentQ < questions.length - 1
                  ? "Next Question"
                  : "See Results"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const xpEarned =
      correctCount * 10 + (score === 100 ? 25 : 0);

    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="bg-surface border border-border rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">
            {score >= 80
              ? "\u{1F389}"
              : score >= 50
                ? "\u{1F44D}"
                : "\u{1F4AA}"}
          </div>
          <h1 className="text-3xl font-bold mb-2">Quiz Complete!</h1>
          <p className="text-text-muted text-lg mb-6">
            {score >= 80
              ? "Excellent work!"
              : score >= 50
                ? "Good effort! Keep practicing."
                : "Keep at it! Review the lessons and try again."}
          </p>

          <div className="flex justify-center gap-8 mb-8">
            <div>
              <div className="text-4xl font-bold text-accent font-mono">
                {score}%
              </div>
              <div className="text-text-dim text-sm">Score</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green font-mono">
                {correctCount}
              </div>
              <div className="text-text-dim text-sm">Correct</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-xp font-mono">
                +{xpEarned}
              </div>
              <div className="text-text-dim text-sm">XP Earned</div>
            </div>
          </div>

          {/* Results breakdown */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wider">
              Results
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
                    r.correct ? "bg-green-dim/30" : "bg-red-dim/30"
                  }`}
                >
                  <span className={r.correct ? "text-green" : "text-red"}>
                    {r.correct ? "\u2713" : "\u2717"}
                  </span>
                  <span className="truncate">{r.question}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setPhase("setup");
                setResults([]);
                setCurrentQ(0);
                setSelectedAnswer(null);
                setShowResult(false);
              }}
              className="px-6 py-2.5 rounded-lg bg-surface border border-border hover:bg-surface-hover transition-all"
            >
              New Quiz
            </button>
            <button
              onClick={onBack}
              className="px-6 py-2.5 rounded-lg bg-accent text-bg font-semibold hover:bg-accent-hover transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="text-center py-12 text-text-muted">
      <p>No questions could be generated for this module.</p>
      <button
        onClick={onBack}
        className="mt-4 text-accent hover:text-accent-hover"
      >
        Go back
      </button>
    </div>
  );
}

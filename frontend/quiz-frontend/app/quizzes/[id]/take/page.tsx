"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { QuizDetail } from "@/types";
import Timer from "@/components/Timer";
import ProgressBar from "@/components/ProgressBar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PageProps { params: Promise<{ id: string }>; }

export default function TakeQuizPage({ params }: PageProps) {
  const { id: quizId }          = use(params);
  const [quiz, setQuiz]         = useState<QuizDetail | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, initialized } = useAuth();
  const router = useRouter();

  const submitAttempt = useCallback(async (currentAnswers: Record<string, string>) => {
    if (!attemptId || submitting) return;
    setSubmitting(true);
    try {
      const payload = Object.entries(currentAnswers).map(([questionId, answer]) => ({ questionId, answer }));
      await api.post(`/api/attempts/${attemptId}/submit`, { answers: payload });
      router.push(`/results/${attemptId}`);
    } catch (err: unknown) {
      alert((err as { response?: { data?: string } })?.response?.data || "Failed to submit attempt.");
      setSubmitting(false);
    }
  }, [attemptId, submitting, router]);

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    (async () => {
      try {
        const quizRes  = await api.get(`/api/quizzes/${quizId}`);
        setQuiz(quizRes.data);
        const startRes = await api.post("/api/attempts/start", { quizId });
        setAttemptId(startRes.data.attemptId);
      } catch { router.push("/quizzes"); }
      finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated, quizId]);

  const handleAnswer = (questionId: string, answer: string) =>
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

  if (loading) return <LoadingSpinner />;
  if (!quiz)   return null;

  const currentQ     = quiz.questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isLast       = currentIdx === quiz.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{quiz.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Question {currentIdx + 1} of {quiz.questions.length}</p>
        </div>
        {attemptId && <Timer seconds={quiz.timeLimit * 60} onExpire={() => submitAttempt(answers)} />}
      </div>

      <ProgressBar current={currentIdx + 1} total={quiz.questions.length} />

      {/* Question Card */}
      <div className="card p-6 mt-5">
        <div className="flex gap-2 mb-3">
          <span className="badge badge-upcoming">{currentQ.type}</span>
          <span className="badge badge-draft">{currentQ.points} pt{currentQ.points !== 1 ? "s" : ""}</span>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-5">{currentQ.text}</h2>

        {/* Multiple Choice */}
        {currentQ.type === "MultipleChoice" && currentQ.options.length > 0 && (
          <div className="space-y-2">
            {currentQ.options.map((opt, i) => (
              <button key={i} onClick={() => handleAnswer(currentQ.id, opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition text-sm ${
                  answers[currentQ.id] === opt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700"
                }`}
              >
                <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* True / False */}
        {currentQ.type === "TrueFalse" && (
          <div className="flex gap-3">
            {["True", "False"].map((opt) => (
              <button key={opt} onClick={() => handleAnswer(currentQ.id, opt)}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition text-sm ${
                  answers[currentQ.id] === opt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 hover:border-indigo-300 text-slate-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Short Answer */}
        {currentQ.type === "ShortAnswer" && (
          <input type="text" placeholder="Type your answer..."
            value={answers[currentQ.id] || ""}
            onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
            className="field-input w-full text-base py-3" />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-5">
        <button onClick={() => setCurrentIdx((i) => i - 1)} disabled={currentIdx === 0}
          className="btn-secondary disabled:opacity-40 flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Dot navigation */}
        <div className="flex gap-1 flex-wrap justify-center max-w-xs">
          {quiz.questions.map((q, i) => (
            <button key={i} onClick={() => setCurrentIdx(i)}
              className={`w-7 h-7 text-xs rounded-full font-medium transition ${
                i === currentIdx
                  ? "bg-indigo-600 text-white"
                  : answers[q.id]
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {isLast ? (
          <button onClick={() => submitAttempt(answers)} disabled={submitting}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
            {submitting ? "Submitting..." : `Submit (${answeredCount}/${quiz.questions.length})`}
          </button>
        ) : (
          <button onClick={() => setCurrentIdx((i) => i + 1)}
            className="btn-primary flex items-center gap-1.5">
            Next
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
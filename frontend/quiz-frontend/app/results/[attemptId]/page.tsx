"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { AttemptResult } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const { attemptId } = use(params);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    api
      .get(`/api/attempts/${attemptId}`)
      .then((res) => setResult(res.data))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated]);

  if (loading) return <LoadingSpinner />;
  if (!result) return null;

  const isPassed = result.percentage >= 60;
  const correct = result.answerResults.filter((a) => a.isCorrect).length;
  const incorrect = result.answerResults.length - correct;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Score Summary */}
      <div
        className={`rounded-2xl p-8 text-center mb-8 ${
          isPassed
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        <div className="text-5xl mb-3">{isPassed ? "🎉" : "📚"}</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-1">
          {result.percentage}%
        </h1>
        <p
          className={`text-lg font-semibold ${
            isPassed ? "text-green-700" : "text-red-600"
          }`}
        >
          {isPassed ? "Great job — Passed!" : "Keep practicing!"}
        </p>
        <p className="text-gray-500 mt-2">
          {result.score} / {result.maxScore} points
        </p>
        <div className="flex justify-center gap-6 mt-4 text-sm text-gray-500">
          <span>✅ {correct} correct</span>
          <span>❌ {incorrect} incorrect</span>
        </div>
      </div>

      {/* Answer Review */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Answer Review</h2>
        <div className="space-y-4">
          {result.answerResults.map((ans, i) => (
            <div
              key={ans.questionId}
              className={`rounded-lg p-4 border ${
                ans.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex justify-between items-start gap-3">
                <p className="font-medium text-gray-900">
                  {i + 1}. {ans.questionText}
                </p>
                <span
                  className={`text-sm font-bold whitespace-nowrap ${
                    ans.isCorrect ? "text-green-700" : "text-red-600"
                  }`}
                >
                  {ans.pointsEarned}/{ans.points} pts
                </span>
              </div>
              <div className="mt-2 text-sm space-y-1">
                <p
                  className={
                    ans.isCorrect ? "text-green-700" : "text-red-600"
                  }
                >
                  Your answer: <strong>{ans.yourAnswer || "(no answer)"}</strong>
                </p>
                {!ans.isCorrect && (
                  <p className="text-green-700">
                    Correct answer: <strong>{ans.correctAnswer}</strong>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link
          href="/quizzes"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Browse More Quizzes
        </Link>
        <Link
          href="/dashboard"
          className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
        >
          My Dashboard
        </Link>
      </div>
    </div>
  );
}

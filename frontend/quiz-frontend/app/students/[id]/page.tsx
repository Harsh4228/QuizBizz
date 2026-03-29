"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StudentDetail } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ScoreBar({ pct }: { pct: number }) {
  const color = pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-sm font-semibold w-10 text-right ${pct >= 60 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500"}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function StudentDetailPage() {
  const router  = useRouter();
  const { id }  = useParams<{ id: string }>();
  const { user, isAuthenticated, initialized } = useAuth();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "Teacher") { router.push("/dashboard"); return; }
    api.get(`/api/users/students/${id}`)
      .then((res) => setStudent(res.data))
      .catch(() => setError("Student not found."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated, id]);

  if (loading) return <LoadingSpinner />;

  if (error || !student) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
        </div>
        <p className="text-slate-600 mb-4">{error || "Student not found."}</p>
        <Link href="/dashboard" className="text-indigo-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const passed = student.attempts.filter((a) => a.passed).length;
  const failed = student.attempts.length - passed;
  const best   = student.attempts.length > 0 ? Math.max(...student.attempts.map((a) => a.percentage)) : 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 gap-1 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Profile header */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-slate-500 text-sm">{student.email}</p>
          <p className="text-xs text-slate-400 mt-0.5">Joined {fmtDate(student.joinedAt)}</p>
        </div>
        <div className="flex gap-3">
          <div className="stat-card text-center py-3 px-5">
            <p className="stat-value text-indigo-600">{student.totalAttempts}</p>
            <p className="stat-label">Attempts</p>
          </div>
          <div className="stat-card text-center py-3 px-5">
            <p className={`stat-value ${student.overallAverage >= 60 ? "text-emerald-600" : student.overallAverage > 0 ? "text-amber-600" : "text-slate-400"}`}>
              {student.totalAttempts > 0 ? `${student.overallAverage}%` : "-"}
            </p>
            <p className="stat-label">Avg Score</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card text-center"><p className="stat-value text-indigo-600">{student.totalAttempts}</p><p className="stat-label">Quizzes Taken</p></div>
        <div className="stat-card text-center"><p className="stat-value text-emerald-600">{passed}</p><p className="stat-label">Passed</p></div>
        <div className="stat-card text-center"><p className="stat-value text-red-500">{failed}</p><p className="stat-label">Failed</p></div>
        <div className="stat-card text-center"><p className="stat-value text-violet-600">{student.totalAttempts > 0 ? `${best}%` : "-"}</p><p className="stat-label">Best Score</p></div>
      </div>

      {/* Attempts table */}
      <div className="card">
        <div className="section-header border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Quiz Attempt History</h2>
        </div>
        {student.attempts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No quiz attempts yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th className="w-44">Progress</th>
                  <th>Passing</th>
                  <th>Result</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {student.attempts.map((a) => (
                  <tr key={a.attemptId}>
                    <td>
                      <Link href={`/quizzes/${a.quizId}`} className="font-medium text-slate-900 hover:text-indigo-600 transition-colors">
                        {a.quizTitle}
                      </Link>
                    </td>
                    <td className="text-slate-700 whitespace-nowrap">{a.score} / {a.maxScore} pts</td>
                    <td><ScoreBar pct={a.percentage} /></td>
                    <td className="text-slate-500">{a.passingMarks > 0 ? `${a.passingMarks} pts` : "60%"}</td>
                    <td>
                      <span className={`badge ${a.passed ? "badge-pass" : "badge-fail"}`}>
                        {a.passed ? "Passed" : "Failed"}
                      </span>
                    </td>
                    <td className="text-slate-400 whitespace-nowrap text-xs">{fmtDateTime(a.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

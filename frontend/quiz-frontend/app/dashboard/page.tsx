"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { MyAttempt, TeacherDashboard, QuizOverview, StudentBrief } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  draft:     "bg-gray-100 text-gray-600",
  upcoming:  "bg-blue-100 text-blue-700",
  active:    "bg-green-100 text-green-700",
  completed: "bg-purple-100 text-purple-700",
  rejected:  "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  draft:     "Draft",
  upcoming:  "Upcoming",
  active:    "Live",
  completed: "Ended",
  rejected:  "Rejected",
};

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtDateTime(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Teacher Tab types ────────────────────────────────────────────────────────

type TDashTab = "overview" | "quizzes" | "students";

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, initialized } = useAuth();

  // Student state
  const [attempts, setAttempts]         = useState<MyAttempt[]>([]);
  // Teacher state
  const [dashboard, setDashboard]       = useState<TeacherDashboard | null>(null);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState<TDashTab>("overview");
  const [quizSearch, setQuizSearch]     = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  const isTeacher = user?.role === "Teacher";

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }

    if (isTeacher) {
      api.get("/api/users/dashboard")
        .then((res) => setDashboard(res.data))
        .finally(() => setLoading(false));
    } else {
      api.get("/api/attempts/my")
        .then((res) => setAttempts(res.data))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated, isTeacher]);

  if (loading) return <LoadingSpinner />;

  // ── Student dashboard ─────────────────────────────────────────────────────
  if (!isTeacher) {
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : 0;
    const passed = attempts.filter((a) => a.percentage >= 60).length;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">My Dashboard</h1>
        <p className="text-gray-500 mb-8">Welcome back, {user?.name}!</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
            <p className="text-3xl font-bold text-blue-600">{attempts.length}</p>
            <p className="text-sm text-gray-500 mt-1">Quizzes Taken</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
            <p className="text-3xl font-bold text-green-600">{avgScore}%</p>
            <p className="text-sm text-gray-500 mt-1">Average Score</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
            <p className="text-3xl font-bold text-purple-600">{passed}</p>
            <p className="text-sm text-gray-500 mt-1">Passed</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Quiz History</h2>
            <Link href="/quizzes" className="text-blue-600 hover:underline text-sm">Browse Quizzes</Link>
          </div>
          {attempts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-medium">No quizzes taken yet.</p>
              <Link href="/quizzes" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                Start your first quiz
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  href={`/results/${attempt.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{attempt.quizTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(attempt.completedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${attempt.percentage >= 60 ? "text-green-600" : "text-red-500"}`}>
                      {attempt.percentage}%
                    </p>
                    <p className="text-xs text-gray-400">{attempt.score}/{attempt.maxScore} pts</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Teacher dashboard ─────────────────────────────────────────────────────
  const d = dashboard!;

  const filteredQuizzes: QuizOverview[] = d.quizzes.filter((q) =>
    q.title.toLowerCase().includes(quizSearch.toLowerCase())
  );

  const filteredStudents: StudentBrief[] = d.students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const navBtn = (t: TDashTab, label: string) => (
    <button
      onClick={() => setTab(t)}
      className={`px-5 py-2 rounded-lg font-medium text-sm transition ${
        tab === t
          ? "bg-blue-600 text-white shadow"
          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Quizzes"   value={d.totalQuizzes}   color="blue"   />
        <StatCard label="Live Quizzes"    value={d.activeQuizzes}  color="green"  />
        <StatCard label="Students"        value={d.totalStudents}  color="purple" />
        <StatCard label="Total Attempts"  value={d.totalAttempts}  color="orange" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {navBtn("overview",  "Overview")}
        {navBtn("quizzes",  `Quizzes (${d.totalQuizzes})`)}
        {navBtn("students", `Students (${d.totalStudents})`)}
      </div>

      {/* ── Overview tab ── */}
      {tab === "overview" && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent quizzes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Recent Quizzes</h2>
              <button onClick={() => setTab("quizzes")} className="text-blue-600 text-xs hover:underline">
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {d.quizzes.slice(0, 5).map((q) => (
                <div key={q.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/quizzes/${q.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm truncate block">
                      {q.title}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {q.questionCount} questions &middot; {q.attemptCount} attempts
                    </p>
                  </div>
                  <span className={`ml-3 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </span>
                </div>
              ))}
              {d.quizzes.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">No quizzes yet.</p>
              )}
            </div>
          </div>

          {/* Top students */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-semibold text-gray-800">Students</h2>
              <button onClick={() => setTab("students")} className="text-blue-600 text-xs hover:underline">
                View all
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {d.students
                .slice()
                .sort((a, b) => b.averageScore - a.averageScore)
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`/students/${s.id}`} className="font-medium text-gray-900 hover:text-blue-600 text-sm">
                        {s.name}
                      </Link>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`text-sm font-bold ${s.averageScore >= 60 ? "text-green-600" : s.averageScore > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                        {s.averageScore > 0 ? `${s.averageScore}%` : "No attempts"}
                      </p>
                      <p className="text-xs text-gray-400">{s.attemptCount} attempt{s.attemptCount !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              {d.students.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-8">No students registered.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Quizzes tab ── */}
      {tab === "quizzes" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-semibold text-gray-800 flex-1">All Quizzes</h2>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={quizSearch}
              onChange={(e) => setQuizSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Questions</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Avg Score</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuizzes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900 max-w-xs truncate">{q.title}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[q.status]}`}>
                        {STATUS_LABEL[q.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{q.questionCount}</td>
                    <td className="px-4 py-3 text-gray-600">{q.attemptCount}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${q.averageScore >= 60 ? "text-green-600" : q.averageScore > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                        {q.averageScore > 0 ? `${q.averageScore}%` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDateTime(q.startTime)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDateTime(q.endTime)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/quizzes/${q.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredQuizzes.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No quizzes found.</p>
            )}
          </div>
        </div>
      )}

      {/* ── Students tab ── */}
      {tab === "students" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-semibold text-gray-800 flex-1">All Students</h2>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Attempts</th>
                  <th className="px-4 py-3">Avg Score</th>
                  <th className="px-4 py-3">Performance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500">{s.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(s.joinedAt)}</td>
                    <td className="px-4 py-3 text-gray-600">{s.attemptCount}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${s.averageScore >= 60 ? "text-green-600" : s.averageScore > 0 ? "text-yellow-600" : "text-gray-400"}`}>
                        {s.averageScore > 0 ? `${s.averageScore}%` : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {s.attemptCount > 0 ? (
                        <div className="w-24">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${s.averageScore >= 60 ? "bg-green-500" : "bg-yellow-400"}`}
                              style={{ width: `${Math.min(s.averageScore, 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No data</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/students/${s.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-10">No students found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:   "text-blue-600",
    green:  "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-center">
      <p className={`text-3xl font-bold ${colors[color] ?? "text-gray-700"}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

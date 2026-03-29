"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Quiz, StudentUser } from "@/types";
import QuizCard from "@/components/QuizCard";
import LoadingSpinner from "@/components/LoadingSpinner";

type TeacherTab = "all" | "current" | "draft" | "completed";
type StudentTab = "current" | "attempted" | "missed";

const toUtcIso = (local: string) =>
  local ? new Date(local).toISOString() : undefined;

// Add 1-minute buffer so the selected start time always arrives in the future
const nowLocalMin = () =>
  new Date(Date.now() + 60000 - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const defaultForm = {
  title: "",
  description: "",
  timeLimit: 30,
  startTime: "",
  endTime: "",
  passingMarks: 0,
  accessType: "all" as "all" | "specific",
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes]         = useState<Quiz[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState(defaultForm);
  const [creating, setCreating]       = useState(false);
  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [teacherTab, setTeacherTab]   = useState<TeacherTab>("all");
  const [studentTab, setStudentTab]   = useState<StudentTab>("current");
  const { user, isAuthenticated, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchQuizzes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/quizzes");
      setQuizzes(res.data);
    } catch { /* handled by interceptor */ }
    finally { setLoading(false); }
  };

  const openCreateForm = async () => {
    if (!showCreate) {
      try {
        const res = await api.get("/api/users/students");
        setAllStudents(res.data);
      } catch { setAllStudents([]); }
    } else {
      setForm(defaultForm);
      setSelectedStudents([]);
    }
    setShowCreate(!showCreate);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startTime || !form.endTime) {
      alert("Please set both start and end date/time.");
      return;
    }
    if (new Date(form.startTime) >= new Date(form.endTime)) {
      alert("End time must be after start time.");
      return;
    }
    setCreating(true);
    try {
      const emails = form.accessType === "specific" ? selectedStudents : [];
      await api.post("/api/quizzes", {
        title: form.title,
        description: form.description,
        timeLimit: form.timeLimit,
        startTime: toUtcIso(form.startTime),
        endTime: toUtcIso(form.endTime),
        passingMarks: form.passingMarks,
        allowedStudentEmails: emails,
      });
      setShowCreate(false);
      setForm(defaultForm);
      setSelectedStudents([]);
      await fetchQuizzes();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: string } })?.response?.data ||
          "Failed to create quiz."
      );
    } finally {
      setCreating(false);
    }
  };

  const isTeacher = user?.role === "Teacher";

  const filteredQuizzes = isTeacher
    ? quizzes.filter((q) => {
        if (teacherTab === "all")       return true;
        if (teacherTab === "current")   return q.status === "active" || q.status === "upcoming";
        if (teacherTab === "draft")     return q.status === "draft";
        if (teacherTab === "completed") return q.status === "completed" || q.status === "rejected";
        return true;
      })
    : quizzes.filter((q) => q.studentStatus === studentTab);

  const tc = {
    all:       quizzes.length,
    current:   quizzes.filter((q) => q.status === "active" || q.status === "upcoming").length,
    draft:     quizzes.filter((q) => q.status === "draft").length,
    completed: quizzes.filter((q) => q.status === "completed" || q.status === "rejected").length,
  };
  const sc = {
    current:   quizzes.filter((q) => q.studentStatus === "current").length,
    attempted: quizzes.filter((q) => q.studentStatus === "attempted").length,
    missed:    quizzes.filter((q) => q.studentStatus === "missed").length,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isTeacher
              ? `${quizzes.length} quiz${quizzes.length !== 1 ? "zes" : ""} total`
              : "Your quiz dashboard"}
          </p>
        </div>
        {isTeacher && (
          <button
            onClick={openCreateForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {showCreate ? "Cancel" : "+ Create Quiz"}
          </button>
        )}
      </div>

      {/* Create Quiz Form */}
      {showCreate && isTeacher && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-5 text-gray-900">New Quiz</h2>
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chapter 5 - Science Quiz"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Brief description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Duration + Passing Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  required
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Marks
                  <span className="text-gray-400 font-normal ml-1">(0 = no requirement)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.passingMarks}
                  onChange={(e) => setForm({ ...form, passingMarks: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Start Time + End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date &amp; Time <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(must be in the future)</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={nowLocalMin()}
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date &amp; Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  min={form.startTime || nowLocalMin()}
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Student Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who Can Take This Quiz?
              </label>
              <div className="flex gap-6 mb-3">
                {(["all", "specific"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accessType"
                      value={v}
                      checked={form.accessType === v}
                      onChange={() => setForm({ ...form, accessType: v })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      {v === "all" ? "All Students" : "Specific Students"}
                    </span>
                  </label>
                ))}
              </div>

              {form.accessType === "specific" && (
                <div className="border border-gray-200 rounded-lg p-3 max-h-52 overflow-y-auto space-y-1">
                  {allStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No registered students found.
                    </p>
                  ) : (
                    allStudents.map((s) => {
                      const checked = selectedStudents.includes(s.email);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setSelectedStudents(
                                checked
                                  ? selectedStudents.filter((e) => e !== s.email)
                                  : [...selectedStudents, s.email]
                              );
                            }}
                            className="accent-blue-600 w-4 h-4"
                          />
                          <span className="text-sm text-gray-800 font-medium">{s.name}</span>
                          <span className="text-xs text-gray-400">{s.email}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
              {form.accessType === "specific" && selectedStudents.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Note */}
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Note: If a quiz is not published before its start time, it will be automatically
              marked as <span className="font-semibold">Rejected</span> and cannot be
              published retroactively.
            </p>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Quiz"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setForm(defaultForm); setSelectedStudents([]); }}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {isTeacher
          ? (["all", "current", "draft", "completed"] as TeacherTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTeacherTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                  teacherTab === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    teacherTab === tab
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {tc[tab]}
                </span>
              </button>
            ))
          : (["current", "attempted", "missed"] as StudentTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setStudentTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  studentTab === tab
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    studentTab === tab
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {sc[tab]}
                </span>
              </button>
            ))}
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-xl font-medium">No quizzes here.</p>
          {isTeacher && teacherTab === "all" && (
            <p className="text-sm mt-2">Create your first quiz to get started!</p>
          )}
          {!isTeacher && studentTab === "current" && (
            <p className="text-sm mt-2">No active quizzes available right now.</p>
          )}
          {!isTeacher && studentTab === "missed" && (
            <p className="text-sm mt-2">You have not missed any quizzes. Great job!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              isTeacher={isTeacher}
              onRefresh={fetchQuizzes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
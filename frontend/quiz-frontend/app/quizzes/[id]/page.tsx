"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { QuizDetail, QuestionWithAnswer, StudentUser } from "@/types";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QuizDetailPage({ params }: PageProps) {
  const { id: quizId } = use(params);
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [teacherQuestions, setTeacherQuestions] = useState<QuestionWithAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddQ, setShowAddQ] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentUser[]>([]);
  const [editForm, setEditForm] = useState<{
    title: string; description: string; timeLimit: number;
    startTime: string; endTime: string; passingMarks: number;
    isPublished: boolean; accessType: "all" | "specific"; selectedEmails: string[];
  } | null>(null);
  const [newQ, setNewQ] = useState({
    text: "",
    type: "MultipleChoice",
    options: ["", "", "", ""],
    correctAnswer: "",
    points: 1,
    orderIndex: 0,
  });
  const { user, isAuthenticated, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated, quizId]);

  const fetchData = async () => {
    try {
      const quizRes = await api.get(`/api/quizzes/${quizId}`);
      setQuiz(quizRes.data);
      if (user?.role === "Teacher") {
        const qRes = await api.get(`/api/quizzes/${quizId}/questions`);
        setTeacherQuestions(qRes.data);
      }
    } catch {
      router.push("/quizzes");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const opts =
      newQ.type !== "ShortAnswer" ? newQ.options.filter((o) => o.trim()) : [];
    try {
      await api.post(`/api/quizzes/${quizId}/questions`, {
        ...newQ,
        options: opts,
        orderIndex: teacherQuestions.length,
      });
      setShowAddQ(false);
      setNewQ({
        text: "",
        type: "MultipleChoice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        orderIndex: 0,
      });
      fetchData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: string } })?.response?.data ||
          "Failed to add question."
      );
    }
  };

  const deleteQuestion = async (qId: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/api/quizzes/${quizId}/questions/${qId}`);
      fetchData();
    } catch {
      alert("Failed to delete question.");
    }
  };

  /** Convert UTC ISO string → datetime-local input value in local time */
  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const nowLocalMin = () =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

  const openEdit = async () => {
    if (!quiz) return;
    try {
      const res = await api.get("/api/users/students");
      setAllStudents(res.data);
    } catch { setAllStudents([]); }
    const existing = quiz.allowedStudentEmails ?? [];
    setEditForm({
      title: quiz.title,
      description: quiz.description,
      timeLimit: quiz.timeLimit,
      startTime: toLocalInput(quiz.startTime),
      endTime: toLocalInput(quiz.endTime),
      passingMarks: quiz.passingMarks,
      isPublished: quiz.isPublished,
      accessType: existing.length > 0 ? "specific" : "all",
      selectedEmails: existing,
    });
    setShowEdit(true);
  };

  const saveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await api.put(`/api/quizzes/${quizId}`, {
        title: editForm.title,
        description: editForm.description,
        timeLimit: editForm.timeLimit,
        isPublished: editForm.isPublished,
        startTime: editForm.startTime ? new Date(editForm.startTime).toISOString() : null,
        endTime: editForm.endTime ? new Date(editForm.endTime).toISOString() : null,
        passingMarks: editForm.passingMarks,
        allowedStudentEmails:
          editForm.accessType === "specific" ? editForm.selectedEmails : [],
      });
      setShowEdit(false);
      fetchData();
    } catch (err: unknown) {
      alert(
        (err as { response?: { data?: string } })?.response?.data ||
          "Failed to save quiz."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!quiz) return null;

  const isTeacher = user?.role === "Teacher";
  const displayQuestions = isTeacher ? teacherQuestions : quiz.questions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Quiz Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <Link
                href="/quizzes"
                className="text-blue-600 hover:underline text-sm"
              >
                ← All Quizzes
              </Link>
              {/* Quiz lifecycle status badge */}
              {({
                draft:     <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Draft</span>,
                upcoming:  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Upcoming</span>,
                active:    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Live</span>,
                completed: <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Ended</span>,
                rejected:  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Rejected</span>,
              } as Record<string, React.ReactNode>)[quiz.status]}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-gray-500 mt-1 text-sm">{quiz.description}</p>
            )}
            <div className="flex flex-wrap gap-5 mt-3 text-sm text-gray-500">
              <span>📋 {displayQuestions.length} questions</span>
              <span>⏱️ {quiz.timeLimit} min</span>
              {quiz.totalMarks > 0 && <span>🏆 {quiz.totalMarks} marks</span>}
              {quiz.passingMarks > 0 && <span>✅ Pass: {quiz.passingMarks}%</span>}
              <span>🗓 {new Date(quiz.createdAt).toLocaleDateString()}</span>
            </div>
            {(quiz.startTime || quiz.endTime) && (
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                {quiz.startTime && <span>📅 Starts: {new Date(quiz.startTime).toLocaleString()}</span>}
                {quiz.endTime   && <span>🏁 Ends: {new Date(quiz.endTime).toLocaleString()}</span>}
              </div>
            )}
          </div>

          {isTeacher && (
            <button
              onClick={showEdit ? () => setShowEdit(false) : openEdit}
              className="shrink-0 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              {showEdit ? "Cancel Edit" : "✏️ Edit Quiz"}
            </button>
          )}

          {!isTeacher && (
            quiz.status === "active" ? (
              <Link
                href={`/quizzes/${quizId}/take`}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Start Quiz
              </Link>
            ) : quiz.status === "upcoming" ? (
              <div className="text-sm text-blue-600 font-medium text-right">
                <div className="text-xs text-gray-400">Starts at</div>
                {new Date(quiz.startTime!).toLocaleString()}
              </div>
            ) : quiz.status === "completed" ? (
              <span className="text-sm text-purple-600 font-medium">Quiz ended</span>
            ) : null
          )}
        </div>
      </div>

      {/* ── Edit Quiz Form (Teacher only) ──────────────── */}
      {isTeacher && showEdit && editForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Edit Quiz Details</h2>
          <form onSubmit={saveQuiz} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Duration + Passing Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
                <input
                  type="number" min={1} max={180} required
                  value={editForm.timeLimit}
                  onChange={(e) => setEditForm({ ...editForm, timeLimit: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passing Percentage (%)
                  <span className="text-gray-400 font-normal"> (0 = no requirement)</span>
                </label>
                <input
                  type="number" min={0} max={100}
                  value={editForm.passingMarks}
                  onChange={(e) => setEditForm({ ...editForm, passingMarks: Number(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Start + End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date &amp; Time *</label>
                <input
                  type="datetime-local" required
                  min={nowLocalMin()}
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date &amp; Time *</label>
                <input
                  type="datetime-local" required
                  min={editForm.startTime || nowLocalMin()}
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Publish toggle */}
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={editForm.isPublished}
                  onChange={(e) => setEditForm({ ...editForm, isPublished: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  {editForm.isPublished ? "Published" : "Draft (unpublished)"}
                </span>
              </label>
            </div>

            {/* Student Access */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Who Can Take This Quiz?</label>
              <div className="flex gap-6 mb-3">
                {(["all", "specific"] as const).map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio" name="editAccess" value={v}
                      checked={editForm.accessType === v}
                      onChange={() => setEditForm({ ...editForm, accessType: v, selectedEmails: v === "all" ? [] : editForm.selectedEmails })}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      {v === "all" ? "All Students" : "Specific Students"}
                    </span>
                  </label>
                ))}
              </div>

              {editForm.accessType === "specific" && (
                <div className="border border-gray-200 rounded-lg p-3 max-h-52 overflow-y-auto space-y-1">
                  {allStudents.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No registered students found.</p>
                  ) : (
                    allStudents.map((s) => {
                      const checked = editForm.selectedEmails.includes(s.email);
                      return (
                        <label key={s.id} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              const next = checked
                                ? editForm.selectedEmails.filter((e) => e !== s.email)
                                : [...editForm.selectedEmails, s.email];
                              setEditForm({ ...editForm, selectedEmails: next });
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
              {editForm.accessType === "specific" && editForm.selectedEmails.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{editForm.selectedEmails.length} student{editForm.selectedEmails.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setShowEdit(false)}
                className="bg-gray-100 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold">
            Questions ({displayQuestions.length})
          </h2>
          {isTeacher && (
            <button
              onClick={() => setShowAddQ(!showAddQ)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              + Add Question
            </button>
          )}
        </div>

        {/* Add Question Form */}
        {showAddQ && (
          <form
            onSubmit={addQuestion}
            className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-5 space-y-3"
          >
            <textarea
              required
              placeholder="Question text *"
              value={newQ.text}
              onChange={(e) => setNewQ({ ...newQ, text: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex gap-3 flex-wrap">
              <select
                value={newQ.type}
                onChange={(e) =>
                  setNewQ({ ...newQ, type: e.target.value, correctAnswer: "" })
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="MultipleChoice">Multiple Choice</option>
                <option value="TrueFalse">True / False</option>
                <option value="ShortAnswer">Short Answer</option>
              </select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Points:</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newQ.points}
                  onChange={(e) =>
                    setNewQ({ ...newQ, points: Number(e.target.value) })
                  }
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {newQ.type === "MultipleChoice" && (
              <div className="grid grid-cols-2 gap-2">
                {newQ.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...newQ.options];
                      opts[i] = e.target.value;
                      setNewQ({ ...newQ, options: opts });
                    }}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            )}

            {newQ.type === "TrueFalse" ? (
              <select
                required
                value={newQ.correctAnswer}
                onChange={(e) =>
                  setNewQ({ ...newQ, correctAnswer: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select correct answer *</option>
                <option value="True">True</option>
                <option value="False">False</option>
              </select>
            ) : (
              <input
                required
                type="text"
                placeholder="Correct answer *"
                value={newQ.correctAnswer}
                onChange={(e) =>
                  setNewQ({ ...newQ, correctAnswer: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Add Question
              </button>
              <button
                type="button"
                onClick={() => setShowAddQ(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Question List */}
        {displayQuestions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>
              No questions yet.{" "}
              {isTeacher ? "Add your first question above." : ""}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayQuestions.map((q, i) => (
              <div
                key={q.id}
                className="border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-1 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {q.type}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {q.points} pt{q.points !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {i + 1}. {q.text}
                    </p>
                    {q.options && q.options.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {q.options.map((opt, oi) => (
                          <span
                            key={oi}
                            className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100"
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    {isTeacher && "correctAnswer" in q && (
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        ✓ Correct: {(q as QuestionWithAnswer).correctAnswer}
                      </p>
                    )}
                  </div>

                  {isTeacher && (
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="ml-3 text-gray-300 hover:text-red-500 transition text-lg"
                      title="Delete question"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

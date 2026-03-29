"use client";

import Link from "next/link";
import { useState } from "react";
import api from "@/lib/api";
import { Quiz } from "@/types";

interface QuizCardProps {
  quiz: Quiz;
  isTeacher: boolean;
  onRefresh: () => void;
}

const TEACHER_STATUS: Record<string, string> = {
  draft: "badge-draft", upcoming: "badge-upcoming",
  active: "badge-active", completed: "badge-completed", rejected: "badge-rejected",
};
const TEACHER_LABEL: Record<string, string> = {
  draft: "Draft", upcoming: "Upcoming", active: "Live", completed: "Ended", rejected: "Rejected",
};
const STUDENT_STATUS: Record<string, string> = {
  current: "badge-active", attempted: "badge-completed", missed: "badge-rejected",
};
const STUDENT_LABEL: Record<string, string> = {
  current: "Available", attempted: "Attempted", missed: "Missed",
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export default function QuizCard({ quiz, isTeacher, onRefresh }: QuizCardProps) {
  const [busy, setBusy] = useState(false);

  const statusKey  = isTeacher ? quiz.status : (quiz.studentStatus ?? "current");
  const badgeCls   = isTeacher ? (TEACHER_STATUS[statusKey] ?? "badge-draft") : (STUDENT_STATUS[statusKey] ?? "badge-draft");
  const badgeLabel = isTeacher ? (TEACHER_LABEL[statusKey] ?? statusKey) : (STUDENT_LABEL[statusKey] ?? statusKey);

  const togglePublish = async () => {
    setBusy(true);
    try {
      await api.put(`/api/quizzes/${quiz.id}`, {
        title: quiz.title, description: quiz.description,
        timeLimit: quiz.timeLimit, isPublished: !quiz.isPublished,
        startTime: quiz.startTime, endTime: quiz.endTime,
        passingMarks: quiz.passingMarks, allowedStudentEmails: quiz.allowedStudentEmails,
      });
      onRefresh();
    } catch (err: unknown) {
      alert((err as { response?: { data?: string } })?.response?.data || "Failed to update quiz.");
    } finally { setBusy(false); }
  };

  const deleteQuiz = async () => {
    if (!confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/quizzes/${quiz.id}`);
      onRefresh();
    } catch {
      alert("Failed to delete quiz.");
      setBusy(false);
    }
  };

  return (
    <div className="card p-5 flex flex-col hover:shadow-md transition-shadow">
      {/* Title + badge */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-900 flex-1 leading-snug">{quiz.title}</h3>
        <span className={`badge ${badgeCls} flex-shrink-0`}>{badgeLabel}</span>
      </div>

      {quiz.description && (
        <p className="text-xs text-slate-500 mb-2 line-clamp-2 leading-relaxed">{quiz.description}</p>
      )}

      {(quiz.startTime || quiz.endTime) && (
        <div className="text-xs text-slate-400 mb-3 space-y-0.5">
          {quiz.startTime && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Starts: {fmt(quiz.startTime)}
            </div>
          )}
          {quiz.endTime && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ends: {fmt(quiz.endTime)}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{quiz.questionCount} questions</span>
        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{quiz.timeLimit} min</span>
        {quiz.totalMarks > 0   && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{quiz.totalMarks} marks</span>}
        {quiz.passingMarks > 0 && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">Pass: {quiz.passingMarks}</span>}
        {quiz.allowedStudentEmails.length > 0 && (
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
            {quiz.allowedStudentEmails.length} restricted
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/quizzes/${quiz.id}`} className="flex-1 text-center btn-primary text-sm py-2">
          {isTeacher ? "Manage" : "View Quiz"}
        </Link>
        {isTeacher && (
          <>
            <button onClick={togglePublish} disabled={busy || quiz.status === "rejected"}
              title={quiz.status === "rejected" ? "Update start time to re-publish" : undefined}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                quiz.isPublished
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
              }`}
            >
              {quiz.isPublished ? "Unpublish" : "Publish"}
            </button>
            <button onClick={deleteQuiz} disabled={busy}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50">
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}


"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const FEATURES = [
  { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", title: "Quiz Builder", desc: "Create professional quizzes with multiple-choice, true/false, and short-answer questions." },
  { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", title: "Timed Assessments", desc: "Built-in countdown timer with automatic submission to ensure fair, time-bound testing." },
  { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", title: "Analytics", desc: "Track student performance with detailed score breakdowns, attempt history, and progress graphs." },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z", title: "Access Control", desc: "Restrict quizzes to specific students, set open or close windows, and manage enrollment." },
  { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "Instant Grading", desc: "Automatic grading with immediate feedback so students always know where they stand." },
  { icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", title: "Scheduling", desc: "Set quiz start and end times in advance. Quizzes automatically activate and expire on schedule." },
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full border border-indigo-100 mb-5">
              Enterprise Learning Platform
            </span>
            <h1 className="text-5xl font-extrabold text-slate-900 leading-tight mb-5 tracking-tight">
              The smarter way to<br />
              <span className="text-indigo-600">assess and learn</span>
            </h1>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-2xl">
              Create rigorous assessments, track student performance, and deliver a professional quiz experience all in one platform.
            </p>

            {isAuthenticated ? (
              <div className="flex gap-3">
                <Link href="/quizzes" className="btn-primary text-base px-6 py-2.5">Browse Quizzes</Link>
                <Link href="/dashboard" className="btn-secondary text-base px-6 py-2.5">My Dashboard</Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/register" className="btn-primary text-base px-6 py-2.5">Get Started Free</Link>
                <Link href="/login" className="btn-secondary text-base px-6 py-2.5">Sign In</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="bg-indigo-700">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-indigo-600">
          {[
            { label: "Quiz Types", value: "3" },
            { label: "Auto Grading", value: "100%" },
            { label: "Roles", value: "2" },
            { label: "Scheduling", value: "Live" },
          ].map((s) => (
            <div key={s.label} className="pl-6 first:pl-0">
              <p className="text-white font-extrabold text-2xl">{s.value}</p>
              <p className="text-indigo-200 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Everything you need</h2>
          <p className="text-slate-500 max-w-xl mx-auto">A complete toolkit for both teachers who create and students who learn.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-indigo-700 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-3">Ready to get started?</h2>
            <p className="text-indigo-200 mb-7">Create your free account today and start building professional assessments.</p>
            <div className="flex justify-center gap-3">
              <Link href="/register" className="bg-white text-indigo-700 font-bold px-6 py-2.5 rounded-lg hover:bg-indigo-50 transition text-sm">
                Create Account
              </Link>
              <Link href="/login" className="border border-indigo-400 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-600 transition text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-600 font-bold">
            <span className="w-6 h-6 bg-indigo-600 rounded text-white text-xs font-black flex items-center justify-center">Q</span>
            QuizApp
          </div>
          <p className="text-xs text-slate-400">QuizApp Enterprise Platform 2026. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
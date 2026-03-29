"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Brand */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          🧠 QuizApp
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <>
              <Link
                href="/quizzes"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
              >
                Quizzes
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
              >
                Dashboard
              </Link>

              {/* User Chip */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <span className="text-sm text-gray-700 font-medium">
                  {user?.name}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    user?.role === "Teacher"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {user?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-red-500 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

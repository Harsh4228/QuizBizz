"use client";

import { useEffect, useRef, useState } from "react";

interface TimerProps {
  seconds: number;
  onExpire: () => void;
}

export default function Timer({ seconds, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire();
      }
      return;
    }

    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isDanger = timeLeft <= 30;
  const isWarning = timeLeft <= 60 && !isDanger;

  return (
    <div
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-lg font-bold select-none ${
        isDanger
          ? "bg-red-100 text-red-600 animate-pulse"
          : isWarning
          ? "bg-yellow-100 text-yellow-700"
          : "bg-blue-100 text-blue-700"
      }`}
    >
      ⏱️ {String(minutes).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

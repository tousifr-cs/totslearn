import { useState } from "react";
import { motion } from "framer-motion";

/** Dots in reading order along a simple path (indices 0..n-1). */
const PATHS: { cx: number; cy: number }[][] = [
  [
    { cx: 40, cy: 160 },
    { cx: 120, cy: 80 },
    { cx: 200, cy: 140 },
    { cx: 280, cy: 60 },
    { cx: 340, cy: 180 },
  ],
  [
    { cx: 60, cy: 60 },
    { cx: 180, cy: 60 },
    { cx: 300, cy: 60 },
    { cx: 300, cy: 160 },
    { cx: 180, cy: 160 },
  ],
];

export default function FollowThePathGame({ onComplete }: { onComplete: () => void }) {
  const [pathIdx, setPathIdx] = useState(0);
  const [next, setNext] = useState(0);
  const [done, setDone] = useState(false);

  const dots = PATHS[pathIdx];

  const handleDot = (i: number) => {
    if (i !== next) return;
    if (next === dots.length - 1) {
      if (pathIdx >= PATHS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setPathIdx((p) => p + 1);
        setNext(0);
      }
    } else {
      setNext((n) => n + 1);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🗺️
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">You followed the path!</h2>
        <button
          type="button"
          onClick={() => {
            setPathIdx(0);
            setNext(0);
            setDone(false);
          }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  const pathD = dots
    .map((d, i) => `${i === 0 ? "M" : "L"} ${d.cx} ${d.cy}`)
    .join(" ");

  return (
    <div className="flex flex-col h-full gap-4 items-center">
      <p className="font-display text-xl font-bold text-center text-foreground">
        Tap the dots in order: 1 → 2 → 3 …
      </p>
      <div className="w-full max-w-md flex-1 min-h-[220px]">
        <svg viewBox="0 0 400 220" className="w-full h-full">
          <path
            d={pathD}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary/40"
          />
          {dots.map((d, i) => {
            const isPast = i < next;
            const isNext = i === next;
            return (
              <g key={`${pathIdx}-${i}`}>
                <circle
                  cx={d.cx}
                  cy={d.cy}
                  r={isNext ? 22 : 18}
                  fill={isPast ? "#22c55e" : isNext ? "#3b82f6" : "#e5e7eb"}
                  stroke="white"
                  strokeWidth="3"
                  className="cursor-pointer"
                  onClick={() => handleDot(i)}
                />
                <text
                  x={d.cx}
                  y={d.cy + 5}
                  textAnchor="middle"
                  className="pointer-events-none select-none font-bold"
                  fill={isPast || isNext ? "#ffffff" : "#1f2937"}
                  style={{ fontSize: 14 }}
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-muted-foreground text-sm font-bold">
        Path {pathIdx + 1} of {PATHS.length} — tap dot {next + 1}
      </p>
    </div>
  );
}

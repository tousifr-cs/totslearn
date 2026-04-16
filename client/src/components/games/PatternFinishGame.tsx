import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type Shape = "circle" | "square" | "triangle";

function ShapeIcon({ shape, size = 48 }: { shape: Shape; size?: number }) {
  const s = size;
  if (shape === "circle")
    return (
      <svg width={s} height={s}>
        <circle cx={s / 2} cy={s / 2} r={s / 2 - 2} fill="currentColor" className="text-primary" />
      </svg>
    );
  if (shape === "square")
    return (
      <svg width={s} height={s}>
        <rect x={4} y={4} width={s - 8} height={s - 8} rx={6} fill="currentColor" className="text-secondary" />
      </svg>
    );
  return (
    <svg width={s} height={s}>
      <polygon
        points={`${s / 2},4 ${s - 4},${s - 4} 4,${s - 4}`}
        fill="currentColor"
        className="text-accent"
      />
    </svg>
  );
}

type Round = { sequence: Shape[]; choices: Shape[]; answer: Shape };

const ROUNDS: Round[] = [
  { sequence: ["circle", "square", "circle"], choices: ["square", "triangle", "circle"], answer: "square" },
  { sequence: ["triangle", "triangle", "square"], choices: ["circle", "triangle", "square"], answer: "triangle" },
  { sequence: ["square", "circle", "square"], choices: ["square", "circle", "triangle"], answer: "circle" },
];

export default function PatternFinishGame({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<Shape | null>(null);
  const [done, setDone] = useState(false);

  const r = ROUNDS[round];
  const shuffled = useMemo(
    () => [...r.choices].sort(() => Math.random() - 0.5),
    [round]
  );

  const pick = (shape: Shape) => {
    if (shape === r.answer) {
      if (round >= ROUNDS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setRound((x) => x + 1);
      }
    } else {
      setWrong(shape);
      setTimeout(() => setWrong(null), 450);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🧩
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Pattern master!</h2>
        <button
          type="button"
          onClick={() => {
            setRound(0);
            setDone(false);
          }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 items-center justify-center">
      <p className="font-display text-xl font-bold text-center text-foreground">What comes next?</p>
      <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap min-h-[72px]">
        {r.sequence.map((sh, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <ShapeIcon shape={sh} size={56} />
            </div>
            {i < r.sequence.length - 1 && <span className="text-2xl text-muted-foreground">→</span>}
          </div>
        ))}
        <span className="text-2xl text-muted-foreground">→</span>
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 border-dashed border-primary flex items-center justify-center bg-primary/5">
          <span className="text-3xl font-black text-primary">?</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {shuffled.map((shape) => (
          <motion.button
            key={`${round}-${shape}`}
            type="button"
            whileTap={{ scale: 0.95 }}
            animate={wrong === shape ? { rotate: [0, -8, 8, 0] } : {}}
            onClick={() => pick(shape)}
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center shadow-lg bg-card border-4
              ${wrong === shape ? "border-red-400" : "border-border"}`}
          >
            <ShapeIcon shape={shape} size={52} />
          </motion.button>
        ))}
      </div>
      <p className="text-muted-foreground font-bold">Round {round + 1} / {ROUNDS.length}</p>
    </div>
  );
}

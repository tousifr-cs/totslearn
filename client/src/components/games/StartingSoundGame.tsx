import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type Opt = { emoji: string; correct: boolean };

type Round = { sound: string; prompt: string; options: Opt[] };

const ROUNDS: Round[] = [
  {
    sound: "/b/",
    prompt: "Which picture starts with the /b/ sound?",
    options: [
      { emoji: "🐻", correct: true },
      { emoji: "🍎", correct: false },
      { emoji: "🐟", correct: false },
    ],
  },
  {
    sound: "/s/",
    prompt: "Which picture starts with the /s/ sound?",
    options: [
      { emoji: "⭐", correct: false },
      { emoji: "🐍", correct: true },
      { emoji: "🍌", correct: false },
    ],
  },
  {
    sound: "/m/",
    prompt: "Which picture starts with the /m/ sound?",
    options: [
      { emoji: "🌙", correct: true },
      { emoji: "🐝", correct: false },
      { emoji: "🦊", correct: false },
    ],
  },
];

export default function StartingSoundGame({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const r = ROUNDS[round];
  const shuffled = useMemo(
    () => [...r.options].sort(() => Math.random() - 0.5),
    [round]
  );

  const pick = (opt: Opt, idx: number) => {
    if (opt.correct) {
      if (round >= ROUNDS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setRound((x) => x + 1);
      }
    } else {
      setWrong(idx);
      setTimeout(() => setWrong(null), 450);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🔊
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Sound superstar!</h2>
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
    <div className="flex flex-col h-full gap-6 items-center justify-center px-2">
      <p className="font-display text-2xl sm:text-3xl font-black text-primary text-center">
        {r.sound}
      </p>
      <p className="text-center font-bold text-lg text-muted-foreground max-w-md">{r.prompt}</p>
      <div className="flex flex-wrap justify-center gap-4">
        {shuffled.map((opt, idx) => (
          <motion.button
            key={`${round}-${opt.emoji}`}
            type="button"
            whileTap={{ scale: 0.95 }}
            animate={wrong === idx ? { x: [-5, 5, -5, 5, 0] } : {}}
            onClick={() => pick(opt, idx)}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-3xl text-6xl flex items-center justify-center shadow-xl bg-card border-4
              ${wrong === idx ? "border-red-400 bg-red-50" : "border-border"}`}
          >
            {opt.emoji}
          </motion.button>
        ))}
      </div>
      <p className="text-muted-foreground font-bold">Round {round + 1} / {ROUNDS.length}</p>
    </div>
  );
}

import { useState, useMemo } from "react";
import { motion } from "framer-motion";

type Round = { target: string; choices: string[]; answer: string };

const DATA: Round[] = [
  { target: "🐱", choices: ["🐱", "🐶", "🐰"], answer: "🐱" },
  { target: "🍌", choices: ["🍎", "🍌", "🍇"], answer: "🍌" },
  { target: "🔵", choices: ["🟢", "🔴", "🔵"], answer: "🔵" },
];

export default function SameDifferentGame({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const r = DATA[round];
  const shuffled = useMemo(
    () => [...r.choices].sort(() => Math.random() - 0.5),
    [round]
  );

  const pick = (emoji: string) => {
    if (emoji === r.answer) {
      if (round >= DATA.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setRound((x) => x + 1);
      }
    } else {
      setWrong(emoji);
      setTimeout(() => setWrong(null), 400);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          ✨
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Sharp eyes!</h2>
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
      <p className="font-display text-xl font-bold text-center text-muted-foreground">
        Which one matches?
      </p>
      <motion.div
        key={round}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-8xl sm:text-9xl p-8 rounded-[2rem] bg-muted/50 border-4 border-dashed border-primary/40"
      >
        {r.target}
      </motion.div>
      <div className="flex flex-wrap justify-center gap-4">
        {shuffled.map((emoji) => (
          <motion.button
            key={emoji}
            type="button"
            whileTap={{ scale: 0.92 }}
            animate={wrong === emoji ? { rotate: [0, -10, 10, 0] } : {}}
            onClick={() => pick(emoji)}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl text-5xl sm:text-6xl flex items-center justify-center shadow-lg bg-card border-4 border-border
              ${wrong === emoji ? "border-red-400 bg-red-50" : ""}`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
      <p className="text-muted-foreground font-bold">Round {round + 1} / {DATA.length}</p>
    </div>
  );
}

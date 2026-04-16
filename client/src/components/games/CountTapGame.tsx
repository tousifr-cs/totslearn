import { useState } from "react";
import { motion } from "framer-motion";

const ROUNDS: { emoji: string; label: string; target: number }[] = [
  { emoji: "🍎", label: "apple", target: 3 },
  { emoji: "⭐", label: "star", target: 4 },
  { emoji: "🐸", label: "frog", target: 2 },
];

export default function CountTapGame({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [taps, setTaps] = useState(0);
  const [done, setDone] = useState(false);

  const current = ROUNDS[round];

  const handleTap = () => {
    const next = taps + 1;
    setTaps(next);
    if (next >= current.target) {
      if (round >= ROUNDS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setRound((r) => r + 1);
        setTaps(0);
      }
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🎉
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Great counting!</h2>
        <button
          type="button"
          onClick={() => {
            setRound(0);
            setTaps(0);
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
    <div className="flex flex-col items-center justify-center h-full gap-8 px-2">
      <p className="text-center font-display text-2xl sm:text-3xl font-bold text-foreground">
        Tap the {current.label}{" "}
        <span className="text-primary">{current.target}</span> times!
      </p>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={handleTap}
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-[2rem] bg-gradient-to-br from-red-100 to-amber-100 shadow-2xl flex items-center justify-center text-8xl sm:text-9xl border-4 border-white"
      >
        {current.emoji}
      </motion.button>
      <div className="font-display text-xl text-muted-foreground">
        Taps: <span className="text-foreground font-bold">{taps}</span> / {current.target}
      </div>
      <p className="text-sm text-muted-foreground">
        Round {round + 1} of {ROUNDS.length}
      </p>
    </div>
  );
}

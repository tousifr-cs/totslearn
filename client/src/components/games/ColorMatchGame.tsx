import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const ROUNDS: { name: string; hex: string; wrong: string[] }[] = [
  { name: "RED", hex: "#ef4444", wrong: ["#3b82f6", "#22c55e"] },
  { name: "BLUE", hex: "#3b82f6", wrong: ["#eab308", "#a855f7"] },
  { name: "GREEN", hex: "#22c55e", wrong: ["#f97316", "#ec4899"] },
];

export default function ColorMatchGame({ onComplete }: { onComplete: () => void }) {
  const [round, setRound] = useState(0);
  const [wrong, setWrong] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const r = ROUNDS[round];
  const options = useMemo(
    () => [r.hex, ...r.wrong].sort(() => Math.random() - 0.5),
    [round]
  );

  const pick = (hex: string, idx: number) => {
    if (hex === r.hex) {
      if (round >= ROUNDS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setRound((x) => x + 1);
      }
    } else {
      setWrong(idx);
      setTimeout(() => setWrong(null), 500);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🌈
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Color star!</h2>
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
      <p className="font-display text-3xl sm:text-4xl font-black text-foreground text-center">
        Tap <span style={{ color: r.hex }}>{r.name}</span>
      </p>
      <div className="flex flex-wrap justify-center gap-4 max-w-md">
        {options.map((hex, idx) => (
          <motion.button
            key={`${round}-${hex}`}
            type="button"
            whileTap={{ scale: 0.95 }}
            animate={wrong === idx ? { x: [-6, 6, -6, 6, 0] } : {}}
            onClick={() => pick(hex, idx)}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-xl border-4 border-white ring-2 ring-black/10"
            style={{ backgroundColor: hex }}
            aria-label={`color ${hex}`}
          />
        ))}
      </div>
      <p className="text-muted-foreground font-bold">
        Round {round + 1} / {ROUNDS.length}
      </p>
    </div>
  );
}

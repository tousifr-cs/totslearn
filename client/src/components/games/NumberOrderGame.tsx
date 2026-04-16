import { useState, useMemo } from "react";
import { motion } from "framer-motion";

const NUMS = [1, 2, 3, 4, 5];

export default function NumberOrderGame({ onComplete }: { onComplete: () => void }) {
  const [order, setOrder] = useState(1);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState<number | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);

  const shuffled = useMemo(() => [...NUMS].sort(() => Math.random() - 0.5), [shuffleKey]);

  const tap = (n: number) => {
    if (n === order) {
      if (n === 5) {
        setDone(true);
        onComplete();
      } else {
        setOrder((o) => o + 1);
      }
    } else {
      setShake(n);
      setTimeout(() => setShake(null), 400);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🔢
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">1, 2, 3, 4, 5!</h2>
        <button
          type="button"
          onClick={() => {
            setOrder(1);
            setDone(false);
            setShuffleKey((k) => k + 1);
          }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-8 items-center justify-center">
      <p className="font-display text-2xl font-black text-center text-foreground">
        Tap numbers in order — start with <span className="text-primary">{order}</span>
      </p>
      <div className="grid grid-cols-5 gap-3 sm:gap-4 max-w-lg w-full">
        {shuffled.map((n) => {
          const used = n < order;
          return (
            <motion.button
              key={n}
              type="button"
              disabled={used}
              whileTap={used ? {} : { scale: 0.92 }}
              animate={shake === n ? { x: [-6, 6, -6, 6, 0] } : {}}
              onClick={() => !used && tap(n)}
              className={`aspect-square rounded-2xl font-display text-3xl sm:text-4xl font-black shadow-lg border-4 transition-all
                ${used ? "opacity-30 border-green-400 bg-green-50 text-green-700 cursor-default" : "bg-card border-border text-foreground hover:bg-primary/10"}
                ${shake === n ? "border-red-400 bg-red-50" : ""}`}
            >
              {n}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

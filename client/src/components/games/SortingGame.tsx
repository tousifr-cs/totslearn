import { useState } from "react";
import { motion } from "framer-motion";

type Zone = "hot" | "cold";

const ITEMS: { emoji: string; label: string; zone: Zone }[] = [
  { emoji: "🍦", label: "ice cream", zone: "cold" },
  { emoji: "☀️", label: "sun", zone: "hot" },
  { emoji: "❄️", label: "snowflake", zone: "cold" },
  { emoji: "🍲", label: "soup", zone: "hot" },
];

export default function SortingGame({ onComplete }: { onComplete: () => void }) {
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<Zone | null>(null);
  const [done, setDone] = useState(false);

  const item = ITEMS[idx];

  const choose = (zone: Zone) => {
    if (zone === item.zone) {
      if (idx >= ITEMS.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setIdx((i) => i + 1);
      }
    } else {
      setWrong(zone);
      setTimeout(() => setWrong(null), 500);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🧺
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Sorted!</h2>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
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
        Is it <span className="text-orange-500">HOT</span> or{" "}
        <span className="text-sky-500">COLD</span>?
      </p>
      <motion.div
        key={idx}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-8xl p-10 rounded-[2rem] bg-muted/60 border-4 border-dashed border-primary/30"
      >
        {item.emoji}
      </motion.div>
      <p className="text-lg font-bold text-foreground capitalize">{item.label}</p>
      <div className="flex gap-4 sm:gap-8 flex-wrap justify-center">
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          animate={wrong === "hot" ? { x: [-4, 4, -4, 4, 0] } : {}}
          onClick={() => choose("hot")}
          className={`px-10 py-6 rounded-3xl font-display text-2xl font-black text-white shadow-xl bg-gradient-to-r from-orange-400 to-red-500
            ${wrong === "hot" ? "ring-4 ring-red-400" : ""}`}
        >
          HOT
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          animate={wrong === "cold" ? { x: [-4, 4, -4, 4, 0] } : {}}
          onClick={() => choose("cold")}
          className={`px-10 py-6 rounded-3xl font-display text-2xl font-black text-white shadow-xl bg-gradient-to-r from-sky-400 to-cyan-500
            ${wrong === "cold" ? "ring-4 ring-red-400" : ""}`}
        >
          COLD
        </motion.button>
      </div>
      <p className="text-muted-foreground font-bold">
        Item {idx + 1} / {ITEMS.length}
      </p>
    </div>
  );
}

import { useState, useRef } from "react";
import { motion } from "framer-motion";

type Card = { id: number; pairId: number; face: string; matched: boolean };

const PAIRS = [
  ["🍎", "🍎"],
  ["🐶", "🐶"],
  ["⭐", "⭐"],
  ["🌙", "🌙"],
];

function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  PAIRS.forEach((pair, pairId) => {
    pair.forEach((face) => {
      cards.push({ id: id++, pairId, face, matched: false });
    });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryMatchGame({ onComplete }: { onComplete: () => void }) {
  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const lockRef = useRef(false);
  const [done, setDone] = useState(false);

  const handleCardClick = (card: Card) => {
    if (lockRef.current || card.matched || revealed.has(card.id)) return;
    if (revealed.size >= 2) return;

    const nextRevealed = new Set(revealed);
    nextRevealed.add(card.id);
    setRevealed(nextRevealed);

    if (nextRevealed.size < 2) return;

    lockRef.current = true;
    const ids = Array.from(nextRevealed);
    const c1 = cards.find((c) => c.id === ids[0])!;
    const c2 = cards.find((c) => c.id === ids[1])!;

    if (c1.pairId === c2.pairId) {
      setTimeout(() => {
        setCards((prev) => {
          const next = prev.map((c) =>
            c.id === c1.id || c.id === c2.id ? { ...c, matched: true } : c
          );
          if (next.every((c) => c.matched)) {
            setDone(true);
            queueMicrotask(() => onComplete());
          }
          return next;
        });
        setRevealed(new Set());
        lockRef.current = false;
      }, 450);
    } else {
      setTimeout(() => {
        setRevealed(new Set());
        lockRef.current = false;
      }, 700);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🎉
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">All pairs found!</h2>
        <button
          type="button"
          onClick={() => {
            setCards(buildDeck());
            setRevealed(new Set());
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
    <div className="flex flex-col h-full gap-4">
      <p className="text-center font-bold text-muted-foreground shrink-0">
        Tap two cards to find matching pairs!
      </p>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 flex-1 content-center max-w-lg mx-auto w-full">
        {cards.map((card) => {
          const show = revealed.has(card.id) || card.matched;
          return (
            <motion.button
              key={card.id}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCardClick(card)}
              className={`aspect-square rounded-2xl text-4xl sm:text-5xl flex items-center justify-center shadow-lg border-4 transition-colors
              ${card.matched ? "bg-green-100 border-green-400" : "bg-card border-border"}
              ${show ? "" : "bg-gradient-to-br from-primary/20 to-secondary/20"}
            `}
            >
              {show ? card.face : "❓"}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

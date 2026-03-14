import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

type Shape = "circle" | "square" | "triangle" | "star" | "heart" | "diamond";

interface ShapeItem {
  id: string;
  shape: Shape;
  color: string;
  matched: boolean;
}

const COLORS = ["#FF5E7E", "#FFB800", "#4facfe", "#43e97b", "#a18cd1", "#fd7956"];

const ShapeSVG = ({ shape, color, size = 60 }: { shape: Shape; color: string; size?: number }) => {
  const s = size;
  switch (shape) {
    case "circle":
      return <svg width={s} height={s}><circle cx={s/2} cy={s/2} r={s/2 - 2} fill={color} /></svg>;
    case "square":
      return <svg width={s} height={s}><rect x={4} y={4} width={s-8} height={s-8} rx={s * 0.1} fill={color} /></svg>;
    case "triangle":
      return <svg width={s} height={s}><polygon points={`${s/2},4 ${s-4},${s-4} 4,${s-4}`} fill={color} /></svg>;
    case "star":
      return (
        <svg width={s} height={s} viewBox="0 0 60 60">
          <polygon points="30,4 36,22 55,22 40,34 46,52 30,41 14,52 20,34 5,22 24,22" fill={color} />
        </svg>
      );
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 60 60">
          <path d="M30 50 C10 35, 2 25, 2 15 C2 7 10 2 18 5 C24 7 28 12 30 15 C32 12 36 7 42 5 C50 2 58 7 58 15 C58 25 50 35 30 50Z" fill={color} />
        </svg>
      );
    case "diamond":
      return <svg width={s} height={s}><polygon points={`${s/2},4 ${s-4},${s/2} ${s/2},${s-4} 4,${s/2}`} fill={color} /></svg>;
    default:
      return null;
  }
};

function generateRound(count: number): ShapeItem[] {
  const shapes: Shape[] = ["circle", "square", "triangle", "star", "heart", "diamond"];
  const selected = [...shapes].sort(() => Math.random() - 0.5).slice(0, count);
  return selected.map((shape, i) => ({
    id: `${shape}-${i}`,
    shape,
    color: COLORS[i % COLORS.length],
    matched: false,
  }));
}

export default function ShapeMatcherGame({ onComplete }: { onComplete: () => void }) {
  const [items, setItems] = useState<ShapeItem[]>(() => generateRound(4));
  const [slots, setSlots] = useState<ShapeItem[]>([]);
  const [selectedShape, setSelectedShape] = useState<ShapeItem | null>(null);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);

  useEffect(() => {
    setSlots([...items].sort(() => Math.random() - 0.5));
  }, [items]);

  const handleShapeClick = (item: ShapeItem) => {
    if (item.matched) return;
    setSelectedShape(item);
  };

  const handleSlotClick = (slot: ShapeItem) => {
    if (!selectedShape) return;
    if (slot.matched) return;

    if (selectedShape.shape === slot.shape) {
      const updated = items.map(i => i.id === selectedShape.id ? { ...i, matched: true } : i);
      const updatedSlots = slots.map(s => s.id === slot.id ? { ...s, matched: true } : s);
      setItems(updated);
      setSlots(updatedSlots);
      setScore(s => s + 10);
      setSelectedShape(null);

      if (updated.every(i => i.matched)) {
        if (round >= 3) {
          setDone(true);
          onComplete();
        } else {
          setTimeout(() => {
            const next = generateRound(4 + round);
            setItems(next);
            setRound(r => r + 1);
            setSelectedShape(null);
          }, 800);
        }
      }
    } else {
      setWrong(slot.id);
      setTimeout(() => setWrong(null), 600);
      setSelectedShape(null);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">⭐</motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">You did it!</h2>
        <p className="text-2xl text-muted-foreground">Score: <span className="text-primary font-bold">{score}</span></p>
        <button onClick={() => { setItems(generateRound(4)); setRound(1); setScore(0); setDone(false); setSelectedShape(null); }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg">
          Play Again
        </button>
      </div>
    );
  }

  const unmatched = items.filter(i => !i.matched);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div className="font-display text-2xl font-bold text-foreground">Round {round} / 3</div>
        <div className="px-4 py-1 bg-secondary/20 rounded-full font-bold text-secondary-foreground">
          ⭐ {score} pts
        </div>
      </div>

      <div className="bg-blue-50 rounded-3xl p-4 text-center text-muted-foreground font-bold shrink-0">
        {selectedShape ? `Now tap the matching ${selectedShape.shape} below!` : "Tap a shape to pick it up!"}
      </div>

      {/* Top: shapes to pick */}
      <div className="flex justify-center gap-4 sm:gap-8 shrink-0 flex-wrap">
        {items.map(item => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleShapeClick(item)}
            className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-3xl bg-white shadow-xl transition-all
              ${item.matched ? "opacity-30 cursor-default" : "cursor-pointer"}
              ${selectedShape?.id === item.id ? "ring-4 ring-primary ring-offset-2 scale-110" : ""}
            `}
          >
            {!item.matched && <ShapeSVG shape={item.shape} color={item.color} size={56} />}
            {item.matched && <span className="text-3xl">✅</span>}
          </motion.button>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-border" />

      {/* Bottom: slots to match into */}
      <div className="flex justify-center gap-4 sm:gap-8 flex-wrap">
        {slots.map(slot => (
          <motion.button
            key={slot.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSlotClick(slot)}
            animate={wrong === slot.id ? { x: [-8, 8, -8, 8, 0] } : {}}
            transition={{ duration: 0.3 }}
            className={`w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-3xl border-4 border-dashed transition-all
              ${slot.matched ? "border-green-400 bg-green-50 cursor-default" : 
                selectedShape ? "border-primary/60 bg-primary/5 cursor-pointer hover:bg-primary/10" : 
                "border-muted bg-muted/30 cursor-default"}
              ${wrong === slot.id ? "border-red-400 bg-red-50" : ""}
            `}
          >
            {slot.matched ? (
              <ShapeSVG shape={slot.shape} color="#22c55e" size={48} />
            ) : (
              <ShapeSVG shape={slot.shape} color="#d1d5db" size={48} />
            )}
          </motion.button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-auto">
        {unmatched.length} shape{unmatched.length !== 1 ? "s" : ""} left to match
      </p>
    </div>
  );
}

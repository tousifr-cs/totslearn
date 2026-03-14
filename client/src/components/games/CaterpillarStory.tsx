import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGES = [
  {
    text: "In the light of the moon a little egg lay on a leaf.",
    bg: "from-blue-900 to-indigo-900",
    illustration: (
      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-indigo-300/30 absolute blur-3xl" />
        <div className="text-9xl">🌙</div>
        <div className="absolute bottom-0 right-8 text-4xl">🍃</div>
        <div className="absolute bottom-2 right-10 w-6 h-6 bg-green-400 rounded-full border-4 border-white shadow-lg" />
      </div>
    ),
  },
  {
    text: "On Sunday morning, the warm sun came up, and POP! out of the egg came a tiny and very hungry caterpillar.",
    bg: "from-yellow-400 to-orange-400",
    illustration: (
      <div className="relative flex items-center justify-center">
        <div className="text-8xl absolute -top-4 left-1/2 -translate-x-1/2">☀️</div>
        <div className="flex items-center mt-10">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-10 h-10 rounded-full bg-green-500 border-4 border-green-300 -ml-3 ${i === 0 ? "ml-0" : ""}`} />
          ))}
          <div className="w-14 h-14 rounded-full bg-green-600 border-4 border-green-300 -ml-3 flex items-center justify-center">
            <span className="text-2xl">🐛</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    text: "On Monday he ate through one apple. But he was still hungry.",
    bg: "from-red-400 to-pink-500",
    illustration: (
      <div className="flex items-center gap-4 justify-center">
        <div className="text-8xl relative">
          🍎
          <div className="absolute top-4 right-3 w-6 h-4 bg-red-700 rounded-r-full" />
        </div>
        <div className="text-5xl">🐛</div>
      </div>
    ),
  },
  {
    text: "On Tuesday he ate through two pears. But he was still hungry.",
    bg: "from-green-400 to-emerald-500",
    illustration: (
      <div className="flex items-center gap-3 justify-center">
        <div className="text-7xl">🍐</div>
        <div className="text-7xl">🍐</div>
        <div className="text-5xl">🐛</div>
      </div>
    ),
  },
  {
    text: "On Wednesday he ate through three plums. But he was still hungry.",
    bg: "from-purple-500 to-violet-600",
    illustration: (
      <div className="flex items-center gap-3 justify-center flex-wrap">
        <div className="text-6xl">🫐</div>
        <div className="text-6xl">🫐</div>
        <div className="text-6xl">🫐</div>
        <div className="text-5xl">🐛</div>
      </div>
    ),
  },
  {
    text: "On Saturday he ate through one piece of chocolate cake, one ice cream, one pickle, one slice of Swiss cheese, and one slice of salami!",
    bg: "from-amber-500 to-yellow-600",
    illustration: (
      <div className="flex flex-wrap gap-2 justify-center text-5xl">
        <span>🎂</span><span>🍦</span><span>🥒</span><span>🧀</span><span>🍕</span>
        <div className="w-full flex justify-center mt-2"><span className="text-6xl">🐛</span></div>
      </div>
    ),
  },
  {
    text: "That night he had a stomachache! The next day he ate through one nice green leaf, and after that he felt much better.",
    bg: "from-teal-400 to-green-500",
    illustration: (
      <div className="flex flex-col items-center gap-4">
        <div className="text-7xl">🤢</div>
        <div className="text-7xl">🍃</div>
        <div className="text-6xl">😊🐛</div>
      </div>
    ),
  },
  {
    text: "He built a small house, called a cocoon, around himself. He stayed inside for more than two weeks. Then he nibbled a hole in the cocoon, pushed his way out and...",
    bg: "from-stone-500 to-stone-700",
    illustration: (
      <div className="flex flex-col items-center gap-3">
        <div className="w-32 h-20 bg-amber-800 rounded-[40%] flex items-center justify-center border-8 border-amber-600">
          <span className="text-3xl">🐛</span>
        </div>
        <div className="w-4 h-12 bg-amber-800 rounded-full" />
        <div className="text-6xl">🌿</div>
      </div>
    ),
  },
  {
    text: "...he was a beautiful butterfly! 🦋",
    bg: "from-pink-400 via-purple-400 to-blue-500",
    illustration: (
      <motion.div
        animate={{ y: [-10, 10, -10], rotate: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="text-center"
      >
        <div className="text-[8rem] leading-none">🦋</div>
        <div className="flex justify-center gap-2 mt-4 text-3xl">
          <span>🌸</span><span>🌺</span><span>🌷</span>
        </div>
      </motion.div>
    ),
  },
];

export default function CaterpillarStory({ onComplete }: { onComplete: () => void }) {
  const [page, setPage] = useState(0);
  const [finished, setFinished] = useState(false);

  const goNext = () => {
    if (page + 1 >= PAGES.length) {
      setFinished(true);
      onComplete();
    } else {
      setPage(p => p + 1);
    }
  };

  const goPrev = () => {
    if (page > 0) setPage(p => p - 1);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">🦋</motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">The End!</h2>
        <p className="text-xl text-muted-foreground">What a wonderful journey!</p>
        <button onClick={() => { setPage(0); setFinished(false); }}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg">
          Read Again
        </button>
      </div>
    );
  }

  const current = PAGES[page];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Progress */}
      <div className="flex gap-1 shrink-0">
        {PAGES.map((_, i) => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-500 ${i <= page ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Story card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 rounded-3xl bg-gradient-to-br ${current.bg} flex flex-col items-center justify-center p-8 gap-6 overflow-hidden`}
        >
          <div className="text-white/90 font-display text-lg sm:text-xl font-bold text-center leading-relaxed max-w-lg">
            {current.text}
          </div>
          <div className="mt-2">
            {current.illustration}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between shrink-0">
        <button
          onClick={goPrev}
          disabled={page === 0}
          className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-primary disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <span className="font-bold text-muted-foreground text-sm">
          Page {page + 1} of {PAGES.length}
        </span>

        <button
          onClick={goNext}
          className="w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-white"
        >
          {page + 1 >= PAGES.length ? "✓" : <ChevronRight className="w-7 h-7" />}
        </button>
      </div>
    </div>
  );
}

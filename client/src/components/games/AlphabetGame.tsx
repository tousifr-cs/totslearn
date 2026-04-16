import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Mic, Loader2 } from "lucide-react";
import { useLetterSpeechRecognition } from "@/hooks/useLetterSpeechRecognition";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LETTER_DATA: Record<string, { word: string; color: string }> = {
  A: { word: "Apple", color: "bg-red-400" },
  B: { word: "Ball", color: "bg-blue-400" },
  C: { word: "Cat", color: "bg-orange-400" },
  D: { word: "Dog", color: "bg-yellow-400" },
  E: { word: "Egg", color: "bg-green-400" },
  F: { word: "Fish", color: "bg-cyan-400" },
  G: { word: "Grape", color: "bg-purple-400" },
  H: { word: "Hat", color: "bg-pink-400" },
  I: { word: "Ice Cream", color: "bg-rose-400" },
  J: { word: "Juice", color: "bg-amber-400" },
  K: { word: "Kite", color: "bg-lime-400" },
  L: { word: "Lion", color: "bg-orange-500" },
  M: { word: "Moon", color: "bg-indigo-400" },
  N: { word: "Nest", color: "bg-teal-400" },
  O: { word: "Orange", color: "bg-orange-400" },
  P: { word: "Pig", color: "bg-pink-500" },
  Q: { word: "Queen", color: "bg-violet-400" },
  R: { word: "Rainbow", color: "bg-red-500" },
  S: { word: "Sun", color: "bg-yellow-500" },
  T: { word: "Tiger", color: "bg-amber-500" },
  U: { word: "Umbrella", color: "bg-blue-500" },
  V: { word: "Violin", color: "bg-purple-500" },
  W: { word: "Whale", color: "bg-cyan-500" },
  X: { word: "Xylophone", color: "bg-green-500" },
  Y: { word: "Yarn", color: "bg-yellow-600" },
  Z: { word: "Zebra", color: "bg-gray-500" },
};

const QUIZ_QUESTIONS = [
  { question: "Which letter starts 🍎 Apple?", answer: "A" },
  { question: "Which letter starts 🐱 Cat?", answer: "C" },
  { question: "Which letter starts 🌙 Moon?", answer: "M" },
  { question: "Which letter starts 🐶 Dog?", answer: "D" },
  { question: "Which letter starts 🌞 Sun?", answer: "S" },
  { question: "Which letter starts 🦁 Lion?", answer: "L" },
  { question: "Which letter starts 🐠 Fish?", answer: "F" },
  { question: "Which letter starts 🍇 Grape?", answer: "G" },
];

const SAY_ROUNDS = 5;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function AlphabetGame({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<"explore" | "quiz" | "say">("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [finishedMode, setFinishedMode] = useState<"quiz" | "say">("quiz");

  const [sayIndex, setSayIndex] = useState(0);
  const [sayScore, setSayScore] = useState(0);
  const [sayFeedback, setSayFeedback] = useState<"correct" | "wrong" | "unclear" | null>(null);

  const shuffledQuestions = useState(() => shuffle(QUIZ_QUESTIONS).slice(0, 5))[0];
  const currentQ = shuffledQuestions[quizIndex];
  const choices = useState(() =>
    shuffledQuestions.map((q) => shuffle(LETTERS.filter((l) => l !== q.answer).slice(0, 3).concat(q.answer))),
  )[0];

  const sayLetters = useState(() => shuffle([...LETTERS]).slice(0, SAY_ROUNDS))[0];
  const targetSayLetter = sayLetters[sayIndex];

  const { state: speechState, lastTranscript, error, supported, listen, clearError } =
    useLetterSpeechRecognition();

  /** Mic + speech APIs require a secure context (HTTPS), except localhost */
  const speechContextOk = useMemo(() => {
    if (typeof window === "undefined") return true;
    return (
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]"
    );
  }, []);

  const handleQuizAnswer = (letter: string) => {
    if (answered) return;
    setAnswered(letter);
    if (letter === currentQ.answer) setQuizScore((s) => s + 1);

    setTimeout(() => {
      if (quizIndex + 1 >= shuffledQuestions.length) {
        setFinishedMode("quiz");
        setDone(true);
        onComplete();
      } else {
        setQuizIndex((i) => i + 1);
        setAnswered(null);
      }
    }, 1200);
  };

  const advanceSay = () => {
    setSayFeedback(null);
    clearError();
    if (sayIndex + 1 >= sayLetters.length) {
      setFinishedMode("say");
      setDone(true);
      onComplete();
    } else {
      setSayIndex((i) => i + 1);
    }
  };

  const handleSayTap = async () => {
    if (speechState === "listening" || sayFeedback === "correct") return;
    clearError();
    setSayFeedback(null);
    const letter = await listen();
    if (letter === targetSayLetter) {
      setSayFeedback("correct");
      setSayScore((s) => s + 1);
      setTimeout(advanceSay, 1200);
    } else if (letter) {
      setSayFeedback("wrong");
      setTimeout(advanceSay, 1500);
    } else {
      setSayFeedback("unclear");
    }
  };

  const resetAll = () => {
    setMode("explore");
    setDone(false);
    setQuizIndex(0);
    setQuizScore(0);
    setAnswered(null);
    setSayIndex(0);
    setSayScore(0);
    setSayFeedback(null);
    clearError();
  };

  const displayScore = finishedMode === "say" ? sayScore : quizScore;
  const displayTotal = finishedMode === "say" ? sayLetters.length : shuffledQuestions.length;

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🏆
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Amazing!</h2>
        <p className="text-2xl text-muted-foreground">
          You got{" "}
          <span className="text-primary font-bold">{displayScore}</span> out of{" "}
          <span className="text-primary font-bold">{displayTotal}</span> right!
        </p>
        <button
          onClick={resetAll}
          className="px-8 py-4 bg-primary text-white rounded-full font-bold text-xl shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-4 shrink-0">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === "explore" ? "bg-primary text-white shadow-lg" : "bg-white text-muted-foreground"}`}
        >
          Explore Letters
        </button>
        <button
          type="button"
          onClick={() => setMode("quiz")}
          className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === "quiz" ? "bg-accent text-white shadow-lg" : "bg-white text-muted-foreground"}`}
        >
          Quiz Me!
        </button>
        <button
          type="button"
          onClick={() => setMode("say")}
          className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all ${mode === "say" ? "bg-violet-500 text-white shadow-lg" : "bg-white text-muted-foreground"}`}
        >
          Say it!
        </button>
      </div>

      {mode === "explore" ? (
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex-1 overflow-y-auto grid grid-cols-6 sm:grid-cols-9 gap-2">
            {LETTERS.map((l) => (
              <motion.button
                key={l}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(l)}
                className={`aspect-square rounded-2xl font-display text-2xl font-black text-white shadow-md transition-all ${selected === l ? "ring-4 ring-offset-2 ring-primary scale-110" : ""} ${LETTER_DATA[l].color}`}
              >
                {l}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className={`shrink-0 rounded-3xl p-6 ${LETTER_DATA[selected].color} text-white flex items-center gap-6 shadow-xl`}
              >
                <span className="font-display text-8xl font-black leading-none">{selected}</span>
                <div>
                  <p className="font-display text-4xl font-black">{LETTER_DATA[selected].word}</p>
                  <p className="text-white/80 text-lg mt-1">
                    is for <strong>{selected}</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : mode === "quiz" ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-6">
          <div className="flex gap-1 mb-2">
            {shuffledQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all ${i < quizIndex ? "bg-green-400" : i === quizIndex ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>

          <motion.div
            key={quizIndex}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md w-full"
          >
            <p className="font-display text-2xl sm:text-3xl font-black text-foreground mb-8">
              {currentQ.question}
            </p>
            <div className="grid grid-cols-2 gap-4">
              {choices[quizIndex].map((letter) => (
                <motion.button
                  key={letter}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleQuizAnswer(letter)}
                  className={`py-5 rounded-2xl font-display text-4xl font-black shadow-lg transition-all
                    ${answered === null ? "bg-primary/10 text-primary hover:bg-primary hover:text-white" : letter === currentQ.answer ? "bg-green-400 text-white scale-105 shadow-green-200 shadow-xl" : answered === letter ? "bg-red-400 text-white" : "bg-muted text-muted-foreground opacity-50"}
                  `}
                >
                  {letter}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-secondary fill-secondary" />
            <span className="font-bold text-lg">{quizScore} correct</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 min-h-0">
          {!supported ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center max-w-md">
              <p className="font-display text-xl font-bold text-foreground mb-2">Speech isn&apos;t available here</p>
              <p className="text-muted-foreground text-sm">
                Try this game in <strong>Chrome</strong> or <strong>Edge</strong> on a computer or Android, and allow the
                microphone when asked.
              </p>
            </div>
          ) : !speechContextOk ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-center max-w-md">
              <p className="font-display text-xl font-bold text-foreground mb-2">Use a secure address</p>
              <p className="text-muted-foreground text-sm">
                Speech and the microphone need <strong>HTTPS</strong>, or open the app at{" "}
                <strong>localhost</strong>. Plain <code className="text-foreground">http://</code> on another computer name
                (e.g. on your LAN) won&apos;t work.
              </p>
            </div>
          ) : (
            <>
              <div className="flex gap-1 mb-1">
                {sayLetters.map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${i < sayIndex ? "bg-green-400" : i === sayIndex ? "bg-violet-500" : "bg-muted"}`}
                  />
                ))}
              </div>

              <motion.div
                key={sayIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 w-full max-w-md"
              >
                <p className="font-display text-xl sm:text-2xl font-black text-foreground text-center">
                  What letter is this?
                </p>
                <div
                  className={`w-full aspect-[4/3] max-h-[220px] rounded-3xl ${LETTER_DATA[targetSayLetter].color} flex items-center justify-center shadow-2xl border-4 border-white/30`}
                >
                  <span className="font-display text-[min(28vw,8rem)] font-black text-white drop-shadow-lg">
                    {targetSayLetter}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  {sayFeedback === "correct" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-green-600 dark:text-green-400 font-bold text-xl"
                    >
                      Yes! That&apos;s {targetSayLetter}!
                    </motion.p>
                  )}
                  {sayFeedback === "wrong" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-500 font-bold text-lg text-center px-2"
                    >
                      Nice try! That was {targetSayLetter}.
                      {lastTranscript ? (
                        <span className="block text-sm font-normal text-muted-foreground mt-1">
                          Heard: &ldquo;{lastTranscript}&rdquo;
                        </span>
                      ) : null}
                    </motion.p>
                  )}
                  {sayFeedback === "unclear" && (
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-amber-700 dark:text-amber-300 font-bold text-center px-2"
                    >
                      I didn&apos;t catch that. Tap the button and say the letter name.
                      {lastTranscript ? (
                        <span className="block text-sm font-normal text-muted-foreground mt-1">
                          Heard: &ldquo;{lastTranscript}&rdquo;
                        </span>
                      ) : null}
                    </motion.p>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center px-4">{error}</p>
                )}

                <motion.button
                  type="button"
                  whileTap={{ scale: speechState === "listening" ? 1 : 0.97 }}
                  onClick={handleSayTap}
                  disabled={speechState === "listening" || sayFeedback === "correct"}
                  className={`mt-2 flex items-center justify-center gap-3 px-10 py-5 rounded-full font-display text-xl font-black text-white shadow-xl transition-all disabled:opacity-70
                    ${speechState === "listening" ? "bg-violet-400" : "bg-violet-600 hover:bg-violet-700"}
                  `}
                >
                  {speechState === "listening" ? (
                    <>
                      <Loader2 className="w-7 h-7 animate-spin" />
                      Listening…
                    </>
                  ) : (
                    <>
                      <Mic className="w-7 h-7" />
                      Tap &amp; say the letter
                    </>
                  )}
                </motion.button>

                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-secondary fill-secondary" />
                  <span className="font-bold text-lg">{sayScore} correct</span>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

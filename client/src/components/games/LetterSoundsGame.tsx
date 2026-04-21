import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Headphones, Mic2, RotateCcw, Star, Volume2 } from "lucide-react";
import {
  LETTER_INFO,
  LETTER_ORDER,
  explorePhrase,
  speechSupported,
  speak,
  speakWordForLetter,
} from "@/lib/letterPhonics";

const LISTEN_ROUNDS = 6;

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function choicesForLetter(answer: string): string[] {
  const pool = LETTER_ORDER.filter((l) => l !== answer);
  const picks = shuffle(pool).slice(0, 3);
  return shuffle([answer, ...picks]);
}

export default function LetterSoundsGame({ onComplete }: { onComplete: () => void }) {
  const [mode, setMode] = useState<"explore" | "listen">("explore");
  const [selected, setSelected] = useState<string | null>(null);
  const [roundSeed, setRoundSeed] = useState(0);
  const [listenIndex, setListenIndex] = useState(0);
  const listenLetters = useMemo(
    () => shuffle([...LETTER_ORDER]).slice(0, LISTEN_ROUNDS),
    [roundSeed],
  );
  const listenChoices = useMemo(
    () => listenLetters.map((L) => choicesForLetter(L)),
    [listenLetters],
  );
  const [answered, setAnswered] = useState<string | null>(null);
  const [listenScore, setListenScore] = useState(0);
  const [done, setDone] = useState(false);
  const [speechBusy, setSpeechBusy] = useState(false);

  const targetLetter = listenLetters[listenIndex];
  const currentChoices = listenChoices[listenIndex];

  const canSpeak = speechSupported();

  const playExplore = useCallback((letter: string) => {
    if (!canSpeak) return;
    setSpeechBusy(true);
    speak(explorePhrase(letter), () => setSpeechBusy(false));
  }, [canSpeak]);

  const playListenWord = useCallback(() => {
    if (!canSpeak || !targetLetter) return;
    setSpeechBusy(true);
    speakWordForLetter(targetLetter, () => setSpeechBusy(false));
  }, [canSpeak, targetLetter]);

  useEffect(() => {
    if (mode !== "listen" || done || !canSpeak || !targetLetter) return;
    const t = window.setTimeout(() => playListenWord(), 400);
    return () => clearTimeout(t);
  }, [mode, listenIndex, done, canSpeak, targetLetter, playListenWord]);

  const handleListenPick = (letter: string) => {
    if (answered) return;
    setAnswered(letter);
    if (letter === targetLetter) {
      setListenScore((s) => s + 1);
    }
    window.setTimeout(() => {
      if (listenIndex + 1 >= listenLetters.length) {
        setDone(true);
        onComplete();
      } else {
        setListenIndex((i) => i + 1);
        setAnswered(null);
      }
    }, 1100);
  };

  const resetAll = () => {
    setMode("explore");
    setDone(false);
    setListenIndex(0);
    setListenScore(0);
    setAnswered(null);
    setSelected(null);
    setRoundSeed((s) => s + 1);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🎧
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Sound star!</h2>
        <p className="text-2xl text-muted-foreground">
          You matched{" "}
          <span className="text-primary font-bold">{listenScore}</span> out of{" "}
          <span className="text-primary font-bold">{listenLetters.length}</span> words.
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-xl shadow-lg"
        >
          Play again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-0">
      <div className="flex flex-wrap gap-2 mb-3 shrink-0">
        <button
          type="button"
          onClick={() => setMode("explore")}
          className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all ${
            mode === "explore"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-muted-foreground border border-border"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Headphones className="w-4 h-4" />
            Hear each sound
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("listen")}
          className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm transition-all ${
            mode === "listen"
              ? "bg-accent text-accent-foreground shadow-lg"
              : "bg-card text-muted-foreground border border-border"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Mic2 className="w-4 h-4" />
            Match the word
          </span>
        </button>
      </div>

      {!canSpeak && (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 rounded-xl px-3 py-2 mb-3 shrink-0">
          Voice playback isn&apos;t available in this browser. Try Chrome, Edge, or Safari.
        </p>
      )}

      {mode === "explore" ? (
        <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
          <p className="text-muted-foreground text-sm shrink-0">
            Tap a letter. You&apos;ll hear the letter&apos;s sound and a word that starts with it.
          </p>
          <div className="flex-1 overflow-y-auto grid grid-cols-6 sm:grid-cols-9 gap-2 min-h-0">
            {LETTER_ORDER.map((l) => (
              <motion.button
                key={l}
                type="button"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setSelected(l);
                  playExplore(l);
                }}
                disabled={speechBusy}
                className={`aspect-square rounded-2xl font-display text-2xl font-black text-white shadow-md transition-all disabled:opacity-60 ${
                  selected === l ? "ring-4 ring-offset-2 ring-primary scale-105" : ""
                } ${LETTER_INFO[l].color}`}
              >
                {l}
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className={`shrink-0 rounded-3xl p-5 sm:p-6 ${LETTER_INFO[selected].color} text-white flex flex-col sm:flex-row items-center gap-4 shadow-xl`}
              >
                <span className="font-display text-7xl sm:text-8xl font-black leading-none">{selected}</span>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-display text-2xl sm:text-3xl font-black capitalize">
                    {LETTER_INFO[selected].word}
                  </p>
                  <p className="text-white/90 text-base mt-1">
                    Letter <strong>{selected}</strong> → &ldquo;{LETTER_INFO[selected].phoneme}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => playExplore(selected)}
                    disabled={speechBusy || !canSpeak}
                    className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 hover:bg-white/30 font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                    Play sound again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center flex-1 gap-4 min-h-0 justify-center">
          <div className="flex gap-1.5 mb-1">
            {listenLetters.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i < listenIndex ? "bg-green-400" : i === listenIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <motion.div
            key={listenIndex}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md flex flex-col items-center gap-5"
          >
            <p className="font-display text-xl sm:text-2xl font-black text-foreground text-center">
              What letter does this word start with?
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Listen to the word, then tap the matching letter.
            </p>

            <button
              type="button"
              onClick={playListenWord}
              disabled={speechBusy || !canSpeak}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-display text-lg font-black shadow-lg hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              <Volume2 className="w-6 h-6" />
              {speechBusy ? "Playing…" : "Hear the word"}
            </button>

            <div className="grid grid-cols-2 gap-3 w-full">
              {currentChoices.map((letter) => {
                const isCorrect = letter === targetLetter;
                const showResult = answered !== null;
                return (
                  <motion.button
                    key={`${listenIndex}-${letter}`}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    disabled={!!answered}
                    onClick={() => handleListenPick(letter)}
                    className={`py-6 rounded-2xl font-display text-4xl font-black shadow-lg border-2 transition-all ${
                      !showResult
                        ? "bg-card border-border hover:border-primary hover:bg-primary/5"
                        : isCorrect
                          ? "bg-green-500 text-white border-green-600 scale-[1.02]"
                          : answered === letter
                            ? "bg-destructive/90 text-destructive-foreground border-destructive"
                            : "bg-muted/50 text-muted-foreground border-transparent opacity-60"
                    }`}
                  >
                    {letter}
                  </motion.button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={playListenWord}
              disabled={speechBusy || !canSpeak}
              className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4" />
              Replay word
            </button>

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary fill-secondary" />
              <span className="font-bold text-lg">{listenScore} correct</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

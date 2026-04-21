import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { playToneSequence, resumeAudioContext } from "@/lib/webAudio";

type Round = { louderFirst: boolean };

function randomRounds(count: number): Round[] {
  return Array.from({ length: count }, () => ({
    louderFirst: Math.random() < 0.5,
  }));
}

const BASE_FREQ = 392;
const TONE_MS = 420;
const GAP_MS = 280;
const VOL_QUIET = 0.06;
const VOL_LOUD = 0.32;

export default function LoudOrQuietGame({ onComplete }: { onComplete: () => void }) {
  const [rounds] = useState(() => randomRounds(5));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [done, setDone] = useState(false);

  const r = rounds[idx];

  const playPair = useCallback(async () => {
    if (playing) return;
    setPlaying(true);
    await resumeAudioContext();
    const firstLouder = r.louderFirst;
    const v1 = firstLouder ? VOL_LOUD : VOL_QUIET;
    const v2 = firstLouder ? VOL_QUIET : VOL_LOUD;
    await playToneSequence(
      [
        { freqHz: BASE_FREQ, durationMs: TONE_MS, volume: v1 },
        { freqHz: BASE_FREQ, durationMs: TONE_MS, volume: v2 },
      ],
      GAP_MS,
    );
    setPlaying(false);
  }, [playing, r.louderFirst]);

  const pick = (choice: "first" | "second") => {
    const louderWasFirst = r.louderFirst;
    const correct =
      (choice === "first" && louderWasFirst) || (choice === "second" && !louderWasFirst);
    if (correct) {
      if (idx >= rounds.length - 1) {
        setDone(true);
        onComplete();
      } else {
        setIdx((x) => x + 1);
      }
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 500);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-2">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl">
          🔊
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Volume champion!</h2>
        <button
          type="button"
          onClick={() => {
            setIdx(0);
            setDone(false);
          }}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-xl shadow-lg"
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 items-center justify-center px-2 max-w-lg mx-auto">
      <p className="font-display text-2xl sm:text-3xl font-black text-primary text-center">
        Which sound was louder?
      </p>
      <p className="text-center text-muted-foreground font-medium text-sm">
        Same note plays twice — listen for which beep is stronger.
      </p>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        disabled={playing}
        onClick={() => void playPair()}
        className="px-8 py-4 rounded-2xl font-display font-black text-lg bg-secondary text-secondary-foreground shadow-lg disabled:opacity-60"
      >
        {playing ? "Playing…" : "Play sounds"}
      </motion.button>

      <div className="grid grid-cols-2 gap-4 w-full">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          animate={wrong ? { x: [-4, 4, -4, 4, 0] } : {}}
          onClick={() => pick("first")}
          className="py-6 rounded-2xl font-display font-black text-xl bg-card border-4 border-border shadow-md"
        >
          1st sound
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          animate={wrong ? { x: [-4, 4, -4, 4, 0] } : {}}
          onClick={() => pick("second")}
          className="py-6 rounded-2xl font-display font-black text-xl bg-card border-4 border-border shadow-md"
        >
          2nd sound
        </motion.button>
      </div>

      <p className="text-muted-foreground font-bold text-sm">
        Round {idx + 1} / {rounds.length}
      </p>
    </div>
  );
}

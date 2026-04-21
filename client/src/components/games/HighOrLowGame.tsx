import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { playToneSequence, resumeAudioContext } from "@/lib/webAudio";

type Round = { higherFirst: boolean };

function randomRounds(count: number): Round[] {
  return Array.from({ length: count }, () => ({
    higherFirst: Math.random() < 0.5,
  }));
}

const LOW_HZ = 293;
const HIGH_HZ = 523;
const TONE_MS = 400;
const GAP_MS = 260;
const VOL = 0.22;

export default function HighOrLowGame({ onComplete }: { onComplete: () => void }) {
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
    const firstHigh = r.higherFirst;
    const f1 = firstHigh ? HIGH_HZ : LOW_HZ;
    const f2 = firstHigh ? LOW_HZ : HIGH_HZ;
    await playToneSequence(
      [
        { freqHz: f1, durationMs: TONE_MS, volume: VOL },
        { freqHz: f2, durationMs: TONE_MS, volume: VOL },
      ],
      GAP_MS,
    );
    setPlaying(false);
  }, [playing, r.higherFirst]);

  const pick = (choice: "first" | "second") => {
    const higherWasFirst = r.higherFirst;
    const correct =
      (choice === "first" && higherWasFirst) || (choice === "second" && !higherWasFirst);
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
          🎵
        </motion.div>
        <h2 className="font-display text-4xl font-black text-foreground">Pitch perfect!</h2>
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
        Which sound was higher?
      </p>
      <p className="text-center text-muted-foreground font-medium text-sm">
        Same volume — listen for which beep sounds more “squeaky” up high.
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

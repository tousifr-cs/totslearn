/**
 * Preschool-friendly phoneme labels for speech synthesis (en-US).
 * Paired with a concrete example word per letter (same set as the alphabet game).
 */
export const LETTER_ORDER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") as string[];

export type LetterInfo = {
  word: string;
  color: string;
  /** Spoken sound label, e.g. "buh", "ah", "mmm" */
  phoneme: string;
};

export const LETTER_INFO: Record<string, LetterInfo> = {
  A: { word: "apple", color: "bg-red-400", phoneme: "ah" },
  B: { word: "ball", color: "bg-blue-400", phoneme: "buh" },
  C: { word: "cat", color: "bg-orange-400", phoneme: "kuh" },
  D: { word: "dog", color: "bg-yellow-400", phoneme: "duh" },
  E: { word: "egg", color: "bg-green-400", phoneme: "eh" },
  F: { word: "fish", color: "bg-cyan-400", phoneme: "fff" },
  G: { word: "grape", color: "bg-purple-400", phoneme: "guh" },
  H: { word: "hat", color: "bg-pink-400", phoneme: "huh" },
  I: { word: "igloo", color: "bg-rose-400", phoneme: "ih" },
  J: { word: "juice", color: "bg-amber-400", phoneme: "juh" },
  K: { word: "kite", color: "bg-lime-400", phoneme: "kuh" },
  L: { word: "lion", color: "bg-orange-500", phoneme: "lll" },
  M: { word: "moon", color: "bg-indigo-400", phoneme: "mmm" },
  N: { word: "nest", color: "bg-teal-400", phoneme: "nnn" },
  O: { word: "octopus", color: "bg-orange-400", phoneme: "oh" },
  P: { word: "pig", color: "bg-pink-500", phoneme: "puh" },
  Q: { word: "queen", color: "bg-violet-400", phoneme: "kwuh" },
  R: { word: "rainbow", color: "bg-red-500", phoneme: "rrr" },
  S: { word: "sun", color: "bg-yellow-500", phoneme: "sss" },
  T: { word: "tiger", color: "bg-amber-500", phoneme: "tuh" },
  U: { word: "umbrella", color: "bg-blue-500", phoneme: "uh" },
  V: { word: "violin", color: "bg-purple-500", phoneme: "vuh" },
  W: { word: "whale", color: "bg-cyan-500", phoneme: "wuh" },
  X: { word: "xylophone", color: "bg-green-500", phoneme: "zzz" },
  Y: { word: "yarn", color: "bg-yellow-600", phoneme: "yuh" },
  Z: { word: "zebra", color: "bg-gray-500", phoneme: "zzz" },
};

export function explorePhrase(letter: string): string {
  const i = LETTER_INFO[letter];
  if (!i) return letter;
  const w = i.word.charAt(0).toUpperCase() + i.word.slice(1);
  return `${w}! Letter ${letter} says ${i.phoneme}.`;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, onEnd?: () => void): void {
  if (!speechSupported()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.88;
  u.pitch = 1.05;
  u.lang = "en-US";
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

/** Speak only the example word (for the listen quiz). */
export function speakWordForLetter(letter: string, onEnd?: () => void): void {
  const i = LETTER_INFO[letter];
  if (!i) {
    onEnd?.();
    return;
  }
  const w = i.word.charAt(0).toUpperCase() + i.word.slice(1);
  speak(w + "!", onEnd);
}

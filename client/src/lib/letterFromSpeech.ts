/**
 * Map English speech-to-text quirks to a single letter A–Z.
 * Handles letter names ("ay", "bee"), single letters, and short phrases.
 */
const LETTER_NAME_WORDS: Record<string, string> = {
  AY: "A",
  AH: "A",
  EY: "A",
  BEE: "B",
  CEE: "C",
  SEE: "C",
  SEA: "C",
  DEE: "D",
  EE: "E",
  EEE: "E",
  GEE: "G",
  JEE: "G",
  AITCH: "H",
  HAITCH: "H",
  I: "I",
  EYE: "I",
  JAY: "J",
  KAY: "K",
  CAKE: "K",
  ELL: "L",
  EM: "M",
  EN: "N",
  OH: "O",
  OW: "O",
  PEE: "P",
  CUE: "Q",
  QUEUE: "Q",
  ARE: "R",
  AR: "R",
  ESS: "S",
  TEE: "T",
  TEA: "T",
  YOU: "U",
  YEW: "U",
  VEE: "V",
  DOUBLE: "W",
  EX: "X",
  WHY: "Y",
  ZEE: "Z",
  ZED: "Z",
};

function wordsFromTranscript(transcript: string): string[] {
  return transcript
    .toUpperCase()
    .replace(/'/g, " ")
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Returns the most likely letter the user said, or null if unclear.
 */
export function letterFromSpeech(transcript: string): string | null {
  const raw = transcript.trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  const words = wordsFromTranscript(raw);

  // "Letter A", "the letter B"
  const letterPhrase = upper.match(/\bLETTER\s+([A-Z])\b/);
  if (letterPhrase) return letterPhrase[1];

  /** Last isolated letter word ("… is A", "it's B") — prefer last token */
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.length === 1 && /[A-Z]/.test(w)) return w;
  }

  // Whole transcript is one letter
  const compact = upper.replace(/[^A-Z]/g, "");
  if (compact.length === 1 && /[A-Z]/.test(compact)) return compact;

  // Phonetic letter names (single word)
  for (const w of words) {
    const mapped = LETTER_NAME_WORDS[w];
    if (mapped) return mapped;
  }

  // "Double U" -> W
  if (upper.includes("DOUBLE") && upper.includes("U")) return "W";

  // Last resort: only one letter anywhere (e.g. short "A")
  const anyLetter = upper.match(/[A-Z]/g);
  if (anyLetter?.length === 1) return anyLetter[0];

  return null;
}

/**
 * Pick best letter from SpeechRecognition results (uses alternatives).
 */
export function letterFromSpeechResult(result: SpeechRecognitionResult): string | null {
  for (let i = 0; i < result.length; i++) {
    const t = result[i]?.transcript;
    if (!t) continue;
    const letter = letterFromSpeech(t);
    if (letter) return letter;
  }
  return null;
}

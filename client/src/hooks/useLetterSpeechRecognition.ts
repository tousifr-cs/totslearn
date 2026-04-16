import { useCallback, useEffect, useRef, useState } from "react";
import { letterFromSpeech, letterFromSpeechResult } from "@/lib/letterFromSpeech";

type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type LetterSpeechState = "idle" | "listening" | "processing";

/** Safety net if neither result nor error fires (seen with some drivers / embeds). */
const LISTEN_TIMEOUT_MS = 15000;

export function useLetterSpeechRecognition() {
  const [state, setState] = useState<LetterSpeechState>("idle");
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const supported = getRecognitionCtor() !== null;

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const listen = useCallback((): Promise<string | null> => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser.");
      return Promise.resolve(null);
    }

    setError(null);
    setLastTranscript("");
    setState("listening");

    return new Promise((resolve) => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }

      const rec = new Ctor();
      recognitionRef.current = rec;
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 8;
      rec.continuous = false;

      let settled = false;
      let gotResult = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const clearListenTimeout = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const safeResolve = (letter: string | null, errMsg: string | null) => {
        if (settled) return;
        settled = true;
        clearListenTimeout();
        try {
          rec.abort();
        } catch {
          /* ignore */
        }
        if (recognitionRef.current === rec) recognitionRef.current = null;
        setState("idle");
        if (errMsg) setError(errMsg);
        resolve(letter);
      };

      timeoutId = setTimeout(() => {
        safeResolve(null, "Still listening… If nothing happens, check the mic and try Chrome.");
      }, LISTEN_TIMEOUT_MS);

      rec.onresult = (event: SpeechRecognitionEvent) => {
        gotResult = true;
        const last = event.results[event.results.length - 1];
        const raw = last[0]?.transcript?.trim() ?? "";
        setLastTranscript(raw);
        const letter = letterFromSpeechResult(last) ?? letterFromSpeech(raw);
        safeResolve(letter, null);
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        /** Must resolve — especially "aborted" when replacing a previous session */
        if (event.error === "aborted") {
          safeResolve(null, null);
          return;
        }
        const msg =
          event.error === "not-allowed"
            ? "Microphone permission is needed to hear your answer."
            : event.error === "no-speech"
              ? "No speech heard. Try again!"
              : event.error === "network"
                ? "Speech recognition needs an internet connection (Chrome sends audio to Google)."
                : `Could not hear you (${event.error}). Try again.`;
        safeResolve(null, msg);
      };

      rec.onend = () => {
        /** End without onresult: silence or aborted before audio — avoid hanging the UI */
        if (!gotResult) safeResolve(null, null);
        if (recognitionRef.current === rec) recognitionRef.current = null;
      };

      try {
        rec.start();
      } catch {
        clearListenTimeout();
        if (!settled) {
          settled = true;
          setError("Could not start the microphone. Try again.");
          setState("idle");
          resolve(null);
        }
      }
    });
  }, []);

  return { state, lastTranscript, error, supported, listen, clearError: () => setError(null) };
}

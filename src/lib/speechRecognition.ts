/**
 * Centralized Speech Recognition & Multilingual Voice Input Manager for AgriVerse
 */

export const SPEECH_LANGUAGE_MAP: Record<string, string> = {
  en: "en-IN",
  te: "te-IN",
  hi: "hi-IN",
  english: "en-IN",
  telugu: "te-IN",
  hindi: "hi-IN",
};

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  en: "English",
  te: "Telugu (తెలుగు)",
  hi: "Hindi (हिन्दी)",
  "en-IN": "English (India)",
  "te-IN": "Telugu",
  "hi-IN": "Hindi",
};

/**
 * Returns speech recognition locale (e.g. te-IN, hi-IN, en-IN) for the given application language
 */
export function getSpeechRecognitionLocale(lang: string | undefined): string {
  if (!lang) return "en-IN";
  const normalized = lang.toLowerCase().trim();
  return SPEECH_LANGUAGE_MAP[normalized] || "en-IN";
}

/**
 * Checks if the user's browser supports Web Speech API / SpeechRecognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Returns the SpeechRecognition constructor if supported
 */
export function getSpeechRecognitionConstructor(): any {
  if (typeof window === "undefined") return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
}

/**
 * Maps speech recognition error codes to farmer-friendly localized error messages
 */
export function getSpeechErrorMessage(error: string, langName = "Selected language"): string {
  switch (error) {
    case "not-allowed":
    case "permission-denied":
      return "Please allow microphone access in your browser settings.";
    case "no-speech":
      return "No speech detected. Please try again.";
    case "audio-capture":
      return "Microphone was not found or is in use by another app.";
    case "network":
      return "Network error occurred during speech recognition. Please check your connection.";
    case "language-not-supported":
      return `${langName} voice input is not supported in this browser. Please try typing your question.`;
    case "aborted":
      return "";
    default:
      return "Unable to recognize speech. Please try again.";
  }
}


import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SPEECH_LANGUAGE_MAP,
  getSpeechRecognitionLocale,
  isSpeechRecognitionSupported,
  getSpeechRecognitionConstructor,
  getSpeechErrorMessage,
} from "./speechRecognition";

describe("Speech Recognition & Multilingual Voice Mapping", () => {
  it("maps English to en-IN", () => {
    expect(getSpeechRecognitionLocale("en")).toBe("en-IN");
    expect(getSpeechRecognitionLocale("English")).toBe("en-IN");
    expect(SPEECH_LANGUAGE_MAP.en).toBe("en-IN");
  });

  it("maps Telugu to te-IN", () => {
    expect(getSpeechRecognitionLocale("te")).toBe("te-IN");
    expect(getSpeechRecognitionLocale("Telugu")).toBe("te-IN");
    expect(SPEECH_LANGUAGE_MAP.te).toBe("te-IN");
  });

  it("maps Hindi to hi-IN", () => {
    expect(getSpeechRecognitionLocale("hi")).toBe("hi-IN");
    expect(getSpeechRecognitionLocale("Hindi")).toBe("hi-IN");
    expect(SPEECH_LANGUAGE_MAP.hi).toBe("hi-IN");
  });

  it("falls back to en-IN for null/undefined or unknown languages", () => {
    expect(getSpeechRecognitionLocale(undefined)).toBe("en-IN");
    expect(getSpeechRecognitionLocale("")).toBe("en-IN");
    expect(getSpeechRecognitionLocale("unknown")).toBe("en-IN");
  });

  it("detects browser SpeechRecognition support", () => {
    const mockRecognition = class MockSpeechRecognition {};
    (globalThis as any).window = (globalThis as any).window || {};
    (globalThis as any).window.SpeechRecognition = mockRecognition;

    expect(isSpeechRecognitionSupported()).toBe(true);
    expect(getSpeechRecognitionConstructor()).toBe(mockRecognition);
  });

  it("returns appropriate error messages for SpeechRecognition failure codes", () => {
    expect(getSpeechErrorMessage("not-allowed")).toContain("allow microphone access");
    expect(getSpeechErrorMessage("permission-denied")).toContain("allow microphone access");
    expect(getSpeechErrorMessage("no-speech")).toContain("No speech detected");
    expect(getSpeechErrorMessage("audio-capture")).toContain("Microphone was not found");
    expect(getSpeechErrorMessage("network")).toContain("Network error");
    expect(getSpeechErrorMessage("language-not-supported", "Telugu")).toContain("Telugu voice input is not supported");
    expect(getSpeechErrorMessage("aborted")).toBe("");
    expect(getSpeechErrorMessage("unknown-code")).toContain("Unable to recognize speech");
  });
});


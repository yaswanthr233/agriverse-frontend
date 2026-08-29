import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { normalizeN8nResponse, aiApi, N8N_AI_WEBHOOK_URL } from "./ai";

describe("n8n AI Response Normalization & Webhook Integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("Case 1 & 2: normalizes data.answer (including { success: true, answer: '...' })", () => {
    const raw1 = { answer: "Chilli plants require well-drained loamy soil with pH 6.5 to 7.5." };
    expect(normalizeN8nResponse(raw1)).toBe("Chilli plants require well-drained loamy soil with pH 6.5 to 7.5.");

    const raw2 = { success: true, answer: "Paris is the capital of France." };
    expect(normalizeN8nResponse(raw2)).toBe("Paris is the capital of France.");
  });

  it("Case 3: normalizes data.response", () => {
    const raw = { response: "Photosynthesis is the process by which green plants make food." };
    expect(normalizeN8nResponse(raw)).toBe("Photosynthesis is the process by which green plants make food.");
  });

  it("Case 4: normalizes data.output", () => {
    const raw = { output: "Organic neem cake helps prevent root rot in chilli." };
    expect(normalizeN8nResponse(raw)).toBe("Organic neem cake helps prevent root rot in chilli.");
  });

  it("Case 5: normalizes data.text", () => {
    const raw = { text: "NPK 120:60:60 kg/ha is recommended." };
    expect(normalizeN8nResponse(raw)).toBe("NPK 120:60:60 kg/ha is recommended.");
  });

  it("Case 6: normalizes array response [ { answer: '...' } ]", () => {
    const raw = [{ answer: "Apply balanced micronutrients during flowering stage." }];
    expect(normalizeN8nResponse(raw)).toBe("Apply balanced micronutrients during flowering stage.");
  });

  it("normalizes direct string response", () => {
    const raw = "Artificial intelligence enables machines to learn from data.";
    expect(normalizeN8nResponse(raw)).toBe("Artificial intelligence enables machines to learn from data.");
  });

  it("returns null for empty or invalid data shapes", () => {
    expect(normalizeN8nResponse(null)).toBeNull();
    expect(normalizeN8nResponse({})).toBeNull();
    expect(normalizeN8nResponse([])).toBeNull();
    expect(normalizeN8nResponse("   ")).toBeNull();
  });

  it("sends arbitrary questions (e.g. 'What is the capital of France?') directly to n8n webhook", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "The capital of France is Paris.",
      }),
    });
    globalThis.fetch = mockFetch;

    const res = await aiApi.chat({ message: "What is the capital of France?" });

    expect(mockFetch).toHaveBeenCalledWith(
      N8N_AI_WEBHOOK_URL,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "What is the capital of France?" }),
      })
    );
    expect(res.answer).toBe("The capital of France is Paris.");
    expect(res.reply).toBe("The capital of France is Paris.");
  });

  it("sends Telugu message directly without local translation or predefined answers", async () => {
    const teluguMsg = "మిరప పంటకు ఏ ఎరువు మంచిది?";
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        answer: "మిరప పంటకు సేంద్రీయ ఎరువులు మరియు సమతుల్య NPK ఎరువులు మంచివి.",
      }),
    });
    globalThis.fetch = mockFetch;

    const res = await aiApi.chat({ message: teluguMsg });

    expect(mockFetch).toHaveBeenCalledWith(
      N8N_AI_WEBHOOK_URL,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: teluguMsg }),
      })
    );
    expect(res.answer).toBe("మిరప పంటకు సేంద్రీయ ఎరువులు మరియు సమతుల్య NPK ఎరువులు మంచివి.");
  });

  it("throws friendly error when n8n returns unparseable or error response (never fake fallback)", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 0,
        message: "Unused Respond to Webhook node found in the workflow",
      }),
    });
    globalThis.fetch = mockFetch;

    await expect(aiApi.chat({ message: "What fertilizer is suitable for chilli?" })).rejects.toThrow(
      "AgriVerse AI returned an unexpected response. Please try again."
    );
  });

  it("throws temporary unavailable error when network fails", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));
    globalThis.fetch = mockFetch;

    await expect(aiApi.chat({ message: "test" })).rejects.toThrow(
      "AgriVerse AI is temporarily unavailable. Please try again."
    );
  });

  it("rejects empty messages without sending network request", async () => {
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch;

    await expect(aiApi.chat("   ")).rejects.toThrow("Please enter a question.");
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

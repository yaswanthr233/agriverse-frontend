import { api } from "../client";
import type {
  AiChatResponse,
  AiCropRecommendResponse,
  AiDiseaseScanResponse,
  AiHealthResponse,
} from "../types";

export const N8N_AI_WEBHOOK_URL =
  import.meta.env.VITE_N8N_AI_WEBHOOK_URL ||
  "https://phani1234.app.n8n.cloud/webhook/c7454a16-e5dc-43ff-a178-f97869ca10e2";

/**
 * Normalizes responses returned by n8n RAG / Gemini workflow into plain string or null.
 * Strictly supports:
 *  - Case 1 & 2: data.answer (or { success: true, answer: "..." })
 *  - Case 3: data.response
 *  - Case 4: data.output
 *  - Case 5: data.text
 *  - Case 6: Array data[0]
 *  - String data
 */
export function normalizeN8nResponse(data: any): string | null {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return null;
    }
    return normalizeN8nResponse(data[0]);
  }

  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof data.answer === "string" && data.answer.trim()) {
    return data.answer.trim();
  }

  if (typeof data.response === "string" && data.response.trim()) {
    return data.response.trim();
  }

  if (typeof data.output === "string" && data.output.trim()) {
    return data.output.trim();
  }

  if (typeof data.text === "string" && data.text.trim()) {
    return data.text.trim();
  }

  if (data.data && typeof data.data === "object") {
    return normalizeN8nResponse(data.data);
  }

  return null;
}

export const aiApi = {
  chat: async (
    optionsOrMessage:
      | string
      | {
          message: string;
          language?: string;
          conversationId?: string;
          context?: any;
          pageContext?: any;
        }
  ): Promise<AiChatResponse> => {
    const rawMessage =
      typeof optionsOrMessage === "string"
        ? optionsOrMessage
        : optionsOrMessage.message;

    const message = (rawMessage || "").trim();
    if (!message) {
      throw new Error("Please enter a question.");
    }

    console.log("Sending AI message to n8n:", message);

    try {
      const response = await fetch(N8N_AI_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("n8n AI response:", data);

      const normalizedAnswer = normalizeN8nResponse(data);

      if (!normalizedAnswer) {
        throw new Error("AgriVerse AI returned an unexpected response. Please try again.");
      }

      const sources = Array.isArray(data?.sources)
        ? data.sources.map((s: any) =>
            typeof s === "string" ? s : s?.title || s?.name || JSON.stringify(s)
          )
        : Array.isArray(data?.[0]?.sources)
        ? data[0].sources.map((s: any) =>
            typeof s === "string" ? s : s?.title || s?.name || JSON.stringify(s)
          )
        : undefined;

      return {
        reply: normalizedAnswer,
        answer: normalizedAnswer,
        message: normalizedAnswer,
        sources,
        source: sources && sources.length > 0 ? `n8n RAG (${sources.join(", ")})` : "n8n AI & Supabase Vector Store",
        disclaimer: "AgriVerse AI advisory guidance. Verify critical agronomy decisions with local agricultural experts.",
      };
    } catch (err: any) {
      console.error("[aiApi.chat error]:", err);
      if (err.message && err.message.includes("unexpected response")) {
        throw new Error("AgriVerse AI returned an unexpected response. Please try again.");
      }
      throw new Error("AgriVerse AI is temporarily unavailable. Please try again.");
    }
  },

  analyzeImage: (image: File, type = "crop", language = "en") => {
    const form = new FormData();
    form.append("type", type);
    form.append("language", language);
    form.append("image", image);
    return api
      .post<AiDiseaseScanResponse>("/api/ai/analyze-image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  scan: (type: string, image: File, language = "en") => {
    const form = new FormData();
    form.append("type", type);
    form.append("language", language);
    form.append("image", image);
    return api
      .post<AiDiseaseScanResponse>("/api/ai/scan", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  health: () =>
    api
      .get<AiHealthResponse>("/api/ai/health")
      .then((r) => r.data),

  recommendCrops: (body: {
    season: string;
    soil: string;
    irrigation: string;
    areaAcres: number;
  }) =>
    api
      .post<AiCropRecommendResponse>("/api/ai/recommend-crops", body)
      .then((r) => r.data),

  clearMemory: (conversationId: string) =>
    api
      .delete(`/api/ai/memory/${conversationId}`)
      .then((r) => r.data),
};

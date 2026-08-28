import { api } from "../client";
import type {
  AiChatResponse,
  AiCropRecommendResponse,
  AiDiseaseScanResponse,
  AiHealthResponse,
} from "../types";

export const aiApi = {
  chat: (
    optionsOrMessage:
      | string
      | {
          message: string;
          language?: string;
          conversationId?: string;
          context?: any;
          pageContext?: any;
        }
  ) => {
    const payload =
      typeof optionsOrMessage === "string"
        ? { message: optionsOrMessage }
        : optionsOrMessage;
    return api.post<AiChatResponse>("/api/ai/chat", payload).then((r) => r.data);
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

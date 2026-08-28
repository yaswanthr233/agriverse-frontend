import { api } from "../client";
import type {
  AiChatResponse,
  AiCropRecommendResponse,
  AiDiseaseScanResponse,
} from "../types";

export const aiApi = {
  chat: (message: string, context?: string) =>
    api
      .post<AiChatResponse>("/api/ai/chat", { message, context })
      .then((r) => r.data),

  scan: (type: string, image: File) => {
    const form = new FormData();
    form.append("type", type);
    form.append("image", image);
    return api
      .post<AiDiseaseScanResponse>("/api/ai/scan", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  recommendCrops: (body: {
    season: string;
    soil: string;
    irrigation: string;
    areaAcres: number;
  }) =>
    api
      .post<AiCropRecommendResponse>("/api/ai/recommend-crops", body)
      .then((r) => r.data),
};

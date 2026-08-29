import { api } from "../client";
import type { UploadResponse } from "../types";

export const uploadsApi = {
  uploadImage: (file: File, folder = "products") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    return api
      .post<UploadResponse>("/api/uploads/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      .then((r) => r.data);
  },
};


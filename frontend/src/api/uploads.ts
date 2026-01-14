import { apiRequest } from "./http";

export type Attachment = {
  url: string;
  publicId: string;
  originalName: string;
  mimeType: string;
  bytes: number;
  resourceType: "raw" | "image" | "video" | string;
};

export async function uploadAttachments(files: File[]) {
  const fd = new FormData();

  // backend should use: upload.array("files")
  files.forEach((f) => fd.append("files", f));

  // Must return: { attachments: Attachment[] } OR { items: Attachment[] }
  return apiRequest<{ items: Attachment[] }>("/api/uploads", {
    method: "POST",
    body: fd as any,
  });
}

export async function deleteAttachment(publicId: string) {
  return apiRequest<{ ok: boolean }>("/api/uploads", {
    method: "DELETE",
    body: { publicId },
  });
}

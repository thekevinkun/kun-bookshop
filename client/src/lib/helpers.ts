import type { IBook } from "../types/book";

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

export const resolveAuthorName = (author: IBook["author"]): string => {
  if (!author) return "Unknown";
  if (typeof author === "string") return author;
  return author.name;
};

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAllAuthors } from "../../hooks/useAuthors";
import api from "../../lib/api";
import AdminModal from "../ui/AdminModal";

import type { IBook } from "../../types/book";

interface BookFormProps {
  book?: IBook | null;
  onClose: () => void;
}

const BookForm = ({ book, onClose }: BookFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!book;

  const [title, setTitle] = useState(book?.title ?? "");
  const [authorId, setAuthorId] = useState(
    typeof book?.author === "string" ? book.author : book?.author?._id ?? "",
  );
  const [price, setPrice] = useState(String(book?.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(
    String(book?.discountPrice ?? ""),
  );
  const [description, setDescription] = useState(book?.description ?? "");
  const [category, setCategory] = useState(book?.category?.join(", ") ?? "");
  const [tags, setTags] = useState(book?.tags?.join(", ") ?? "");
  const [fileType, setFileType] = useState<"pdf" | "epub">(
    book?.fileType ?? "pdf",
  );
  const [isFeatured, setIsFeatured] = useState(book?.isFeatured ?? false);
  const [videoUrl, setVideoUrl] = useState(book?.videoUrl ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authors = useAllAuthors();

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append("title", title);
      formData.append("author", authorId);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("fileType", fileType);

      const categoryArray = category
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      formData.append("category", JSON.stringify(categoryArray));

      if (discountPrice) formData.append("discountPrice", discountPrice);
      if (tags) {
        const tagsArray = tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
        formData.append("tags", JSON.stringify(tagsArray));
      }
      if (videoUrl) formData.append("videoUrl", videoUrl);
      if (isFeatured) formData.append("isFeatured", String(isFeatured));
      if (coverFile) formData.append("coverImage", coverFile);
      if (bookFile) formData.append("file", bookFile);

      if (isEditing) {
        await api.put(`/books/${book._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/books", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      queryClient.invalidateQueries({ queryKey: ["books"] });
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      title={isEditing ? "Edit Book" : "Add New Book"}
      onClose={onClose}
      disableClose={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Book title"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Author *</label>
          <select
            value={authorId}
            onChange={(e) => setAuthorId(e.target.value)}
            className="input-field"
          >
            <option value="">Select an author...</option>
            {authors.data?.map((a: { _id: string; name: string }) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>
          {authors.data?.length === 0 && (
            <p className="text-amber-400 text-xs mt-1">
              No authors found. Add an author first before adding books.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Price ($) *
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-field"
              placeholder="19.99"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Discount Price ($)
            </label>
            <input
              type="number"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="input-field"
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            File Type *
          </label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value as "pdf" | "epub")}
            className="input-field"
          >
            <option value="pdf">PDF</option>
            <option value="epub">ePub</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Categories * (comma-separated)
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
            placeholder="Non-Fiction, Self-help"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="bestseller, award-winning"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Description * (min 20 chars)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field resize-none"
            rows={4}
            placeholder="Book description..."
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Video URL (YouTube embed)
          </label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="input-field"
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 accent-teal-500"
          />
          <label htmlFor="isFeatured" className="text-slate-400 text-sm">
            Feature on homepage carousel
          </label>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Cover Image {isEditing ? "(leave empty to keep current)" : "*"}
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="text-slate-300 text-sm"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Book File (PDF/ePub) {isEditing ? "(leave empty to keep current)" : "*"}
          </label>
          <input
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
            className="text-slate-300 text-sm"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-ghost flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? isEditing
                ? "Saving changes..."
                : "Adding book..."
              : isEditing
                ? "Save Changes"
                : "Add Book"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export default BookForm;

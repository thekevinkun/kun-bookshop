import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAllAuthors } from "../../hooks/useAuthors";

import { toast } from "sonner";
import { AdminModal } from "../ui";

import type { IBook } from "../../types/book";
import api from "../../lib/api";

interface BookFormProps {
  book?: IBook | null;
  onClose: () => void;
}

const BookForm = ({ book, onClose }: BookFormProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!book;

  const [title, setTitle] = useState(book?.title ?? "");
  const [authorId, setAuthorId] = useState(
    typeof book?.author === "string" ? book.author : (book?.author?._id ?? ""),
  );
  const [price, setPrice] = useState(String(book?.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(
    String(book?.discountPrice ?? ""),
  );
  const [description, setDescription] = useState(book?.description ?? "");
  const [category, setCategory] = useState(book?.category?.join(", ") ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [publisher, setPublisher] = useState(book?.publisher ?? "");
  const [publishedDate, setPublishedDate] = useState(
    book?.publishedDate
      ? new Date(book.publishedDate).toISOString().split("T")[0] // Format as YYYY-MM-DD for the input
      : "",
  );
  const [previewPages, setPreviewPages] = useState(
    String(book?.previewPages ?? ""),
  );
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

      // Optional fields — only append if they have a value
      if (isbn) formData.append("isbn", isbn);
      if (publisher) formData.append("publisher", publisher);
      if (publishedDate) formData.append("publishedDate", publishedDate);
      if (previewPages) formData.append("previewPages", previewPages);

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
      toast.success(
        isEditing ? "Book updated successfully" : "Book added successfully",
      );
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ??
          (isEditing ? "Failed to update book" : "Failed to add book"),
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
        {/* Title and author are required, so we show them first */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder="Book title"
          />
        </div>

        {/* Author dropdown — required, populated from authors query */}
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

        {/* Price and discount price side by side */}
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

        {/* Category input — required, comma-separated */}
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

        {/* Category input — required, comma-separated */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Categories * (comma-separated)
          </label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-field"
            placeholder="Biography, Non-Fiction, Fantasy"
          />
        </div>

        {/* Tags input — optional, comma-separated */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="input-field"
            placeholder="bestseller, newrelease, award-winning"
          />
        </div>

        {/* ISBN and publisher side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">ISBN</label>
            <input
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="input-field"
              placeholder="978-3-16-148410-0 (optional)"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Publisher
            </label>
            <input
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="input-field"
              placeholder="Penguin Classics"
            />
          </div>
        </div>

        {/* Published date + Preview pages side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Published Date
            </label>
            {/* Date input — browser renders a native date picker */}
            <input
              type="date"
              value={publishedDate}
              onChange={(e) => setPublishedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Preview Pages
            </label>
            <input
              type="number"
              value={previewPages}
              onChange={(e) => setPreviewPages(e.target.value)}
              className="input-field"
              placeholder="e.g. 10 (optional)"
              min={0}
            />
          </div>
        </div>

        {/* Description textarea */}
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

        {/* Video URL input */}
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

        {/* Is Featured checkbox */}
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

        {/* Cover image file input */}
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

        {/* Book file input */}
        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Book File (PDF/ePub){" "}
            {isEditing ? "(leave empty to keep current)" : "*"}
          </label>
          <input
            type="file"
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
            className="text-slate-300 text-sm"
          />
        </div>

        {/* Error message */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Submit and cancel buttons */}
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

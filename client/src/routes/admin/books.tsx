// Import React hooks
import { useState } from "react";

// Import React Query for the books data (reusing Phase 3 hooks)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import icons
import { Plus, Pencil, Trash2, Search } from "lucide-react";

// Import useDebouncedValue from Mantine — NOT useDebounce (wrong hook name)
import { useDebouncedValue } from "@mantine/hooks";

// Import our Axios instance
import api from "../../lib/api";

import type { IBook } from "../../types/book";

// ── BookFormModal component
// Handles both creating a new book and editing an existing one
interface BookFormModalProps {
  book?: IBook | null; // If provided, we're editing; if null, we're creating
  onClose: () => void;
}

const BookFormModal = ({ book, onClose }: BookFormModalProps) => {
  const queryClient = useQueryClient();
  const isEditing = !!book; // True if we received an existing book to edit

  // Local form state — pre-fill with existing values if editing
  const [title, setTitle] = useState(book?.title ?? "");
  const [authorName, setAuthorName] = useState(book?.authorName ?? "");
  const [price, setPrice] = useState(String(book?.price ?? ""));
  const [discountPrice, setDiscountPrice] = useState(
    String(book?.discountPrice ?? ""),
  );
  const [category, setCategory] = useState(book?.category.join(", ") ?? "");
  const [description, setDescription] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submission — works for both create and edit
  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      // Build a FormData object because this endpoint accepts file uploads
      const formData = new FormData();
      formData.append("title", title);
      formData.append("authorName", authorName);
      formData.append("price", price);
      formData.append("description", description);

      // Only include optional fields if they have values
      if (discountPrice) formData.append("discountPrice", discountPrice);

      // Split the comma-separated categories string into an array
      category
        .split(",")
        .map((c) => c.trim())
        .forEach((c) => formData.append("category[]", c));

      // Only append files if the user selected new ones
      if (coverFile) formData.append("coverImage", coverFile);
      if (bookFile) formData.append("bookFile", bookFile);

      if (isEditing) {
        // Update the existing book — PUT /api/books/:id
        await api.put(`/books/${book!._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Create a new book — POST /api/books
        await api.post("/books", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      // Invalidate the books cache so the table refreshes with the new data
      queryClient.invalidateQueries({ queryKey: ["books"] });
      onClose(); // Close the modal on success
    } catch (err: unknown) {
      // Show the error from the server, or a fallback message
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ?? "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Modal backdrop — clicking outside does nothing (user must use Cancel button)
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-white font-semibold text-lg">
            {isEditing ? "Edit Book" : "Add New Book"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {/* Form fields */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Book title"
            />
          </div>

          {/* Author name */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Author Name
            </label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="input-field"
              placeholder="Author full name"
            />
          </div>

          {/* Price + Discount Price side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                Price ($)
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

          {/* Category */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Categories (comma-separated)
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              placeholder="Fiction, Sci-Fi, Adventure"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="Book description..."
            />
          </div>

          {/* Cover image file input */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Cover Image {isEditing && "(leave empty to keep current)"}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              className="text-slate-300 text-sm"
            />
          </div>

          {/* Book file input (PDF or ePub) */}
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Book File (PDF/ePub){" "}
              {isEditing && "(leave empty to keep current)"}
            </label>
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={(e) => setBookFile(e.target.files?.[0] ?? null)}
              className="text-slate-300 text-sm"
            />
          </div>

          {/* Error message */}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Book"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// AdminBooks page
const AdminBooks = () => {
  const queryClient = useQueryClient();

  // Search input value — raw (updates on every keystroke)
  const [search, setSearch] = useState("");

  // Debounced version — only updates 400ms after the user stops typing
  // This prevents firing a new API request on every single keystroke
  const [debouncedSearch] = useDebouncedValue(search, 400);

  // Which book is currently being edited (null = no modal open)
  const [editingBook, setEditingBook] = useState<IBook | null | undefined>(
    undefined,
  );

  // Fetch books list — reusing the existing /api/books endpoint from Phase 3
  const { data, isLoading } = useQuery({
    queryKey: ["books", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const { data } = await api.get(`/books?${params}`);
      return data;
    },
  });

  // Mutation to soft-delete a book (sets isActive: false via DELETE /api/books/:id)
  const { mutate: deleteBook } = useMutation({
    mutationFn: (bookId: string) => api.delete(`/books/${bookId}`),
    onSuccess: () => {
      // Refresh the books list after deletion
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });

  // Confirm before deleting — we don't want accidental deletions
  const handleDelete = (book: IBook) => {
    if (
      window.confirm(`Delete "${book.title}"? This action cannot be undone.`)
    ) {
      deleteBook(book._id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Books</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your book catalog.
          </p>
        </div>
        {/* Add book button — opens modal with no pre-filled book (create mode) */}
        <button
          onClick={() => setEditingBook(null)} // null = create mode
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Book
        </button>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
          placeholder="Search books..."
        />
      </div>

      {/* Books table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading books...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Book
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Price
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Category
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Sales
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Status
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.books?.map((book: IBook) => (
                  <tr
                    key={book._id}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Book cover + title + author */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-10 h-14 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "/placeholder-cover.jpg";
                          }}
                        />
                        <div>
                          <p className="text-white font-medium line-clamp-1">
                            {book.title}
                          </p>
                          {/* Always use authorName — never book.author */}
                          <p className="text-slate-400 text-xs">
                            {book.authorName}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white">
                      ${book.discountPrice ?? book.price}
                      {book.discountPrice && (
                        <span className="text-slate-500 line-through ml-2 text-xs">
                          ${book.price}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {book.category.slice(0, 2).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {book.purchaseCount}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
                        ${book.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                      >
                        {book.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit button — opens modal pre-filled with this book */}
                        <button
                          onClick={() => setEditingBook(book)}
                          className="p-2 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(book)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render the Add/Edit modal when editingBook is not undefined */}
      {/* undefined = closed, null = create mode, Book object = edit mode */}
      {editingBook !== undefined && (
        <BookFormModal
          book={editingBook}
          onClose={() => setEditingBook(undefined)} // Close modal by resetting to undefined
        />
      )}
    </div>
  );
};

export default AdminBooks;

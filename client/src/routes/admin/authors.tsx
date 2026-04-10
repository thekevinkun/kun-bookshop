// Import React hooks
import { useState } from "react";

// Import our author hooks
import { useAuthors, useDeleteAuthor } from "../../hooks/useAuthors";

// Import icons
import { Plus, Pencil, Trash2, Search, User } from "lucide-react";

// Import useDebouncedValue so search doesn't fire on every keystroke
import { useDebouncedValue } from "@mantine/hooks";
import { toast } from "sonner";

// Import the AuthorForm modal component
import { AuthorForm } from "../../components/forms";

// Import auhtor type
import type { IAuthor } from "../../types/book";

// AdminAuthors page
export default function AdminAuthors() {
  // Pagination state
  const [page, setPage] = useState(1);

  // Search input — raw value
  const [search, setSearch] = useState("");

  // Debounced version — only used in the API call
  const [debouncedSearch] = useDebouncedValue(search, 400);

  // Which author is being edited — undefined = modal closed, null = create mode
  const [editingAuthor, setEditingAuthor] = useState<
    IAuthor | null | undefined
  >(undefined);

  // Fetch authors list
  const { data, isLoading } = useAuthors(page, debouncedSearch);

  // Delete mutation
  const { mutate: deleteAuthor } = useDeleteAuthor();

  const handleDelete = (author: IAuthor) => {
    if (
      window.confirm(
        `Delete "${author.name}"? This cannot be undone if they have no books.`,
      )
    ) {
      deleteAuthor(author._id, {
        onSuccess: () => toast.success(`"${author.name}" deleted successfully`),
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error ?? "Failed to delete author",
          ),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white">Authors</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data?.total ?? 0} authors in the system.
          </p>
        </div>
        <button
          onClick={() => setEditingAuthor(null)} // null = create mode
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add Author
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input-field pl-9"
          placeholder="Search authors..."
        />
      </div>

      {/* Authors table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">
            Loading authors...
          </div>
        ) : data?.authors?.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No authors yet. Add one to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Author
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Specialties
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Nationality
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.authors?.map((author: IAuthor) => (
                  <tr
                    key={author._id}
                    className="hover:bg-slate-700/20 transition-colors"
                  >
                    {/* Avatar + name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {author.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-600"
                          />
                        ) : (
                          // Fallback icon if no avatar
                          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <User size={18} className="text-slate-400" />
                          </div>
                        )}
                        <p className="text-white font-medium">{author.name}</p>
                      </div>
                    </td>

                    {/* Specialties — show first two as badges */}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {author.specialty?.slice(0, 2).map((s: string) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-teal-500/20 text-teal-400 rounded text-xs border border-teal-500/20"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Nationality */}
                    <td className="px-6 py-4 text-slate-400">
                      {author.nationality ?? "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingAuthor(author)}
                          className="p-2 text-slate-400 hover:text-teal-400
                          hover:bg-teal-500/10 rounded-lg transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(author)}
                          className="p-2 text-slate-400 hover:text-red-400
                            hover:bg-red-500/10 rounded-lg transition-colors"
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

        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.totalPages}
                className="px-3 py-1.5 text-sm bg-slate-700 text-slate-300 rounded-lg
                  hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {editingAuthor !== undefined && (
        <AuthorForm
          author={editingAuthor}
          onClose={() => setEditingAuthor(undefined)}
        />
      )}
    </div>
  );
}

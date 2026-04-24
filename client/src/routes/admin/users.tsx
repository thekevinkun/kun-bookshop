// Import React hooks
import { useState } from "react";

// Import our admin hooks for users, role update, and delete
import {
  useAdminUsers,
  useUpdateUserRole,
  useDeleteUser,
} from "../../hooks/useAdmin";

// Import icons
import {
  Search,
  Shield,
  ShieldOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Import useDebouncedValue so search doesn't fire on every keystroke
import { useDebouncedValue } from "@mantine/hooks";
import { toast } from "sonner";

// Import our auth store so we can get the current user's ID
// This prevents showing delete/role buttons for the logged-in admin's own row
import { useAuthStore } from "../../store/auth";

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore(); // The logged-in admin

  // Pagination state
  const [page, setPage] = useState(1);

  // Search input — raw value updates on every keystroke
  const [search, setSearch] = useState("");

  // Debounced version — only used in the API call (waits 400ms after last keystroke)
  const [debouncedSearch] = useDebouncedValue(search, 400);

  // Fetch users with current page + debounced search
  const { data, isLoading } = useAdminUsers(page, debouncedSearch);

  // Mutation hooks
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateUserRole();
  const { mutate: deleteUser, isPending: isDeletingUser } = useDeleteUser();

  // Toggle a user's role — if currently 'user' make them 'admin', and vice versa
  const handleRoleToggle = (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const targetUser = data?.users?.find((u: AdminUser) => u._id === userId);
    if (window.confirm(`Change this user's role to "${newRole}"?`)) {
      updateRole(
        { userId, role: newRole },
        {
          onSuccess: () =>
            toast.success(
              targetUser
                ? `${targetUser.email} is now ${newRole}`
                : `User role changed to ${newRole}`,
            ),
          onError: (err: unknown) =>
            toast.error(
              (err as { response?: { data?: { error?: string } } }).response
                ?.data?.error ?? "Failed to update user role",
            ),
        },
      );
    }
  };

  // Confirm before deleting a user
  const handleDelete = (userId: string, email: string) => {
    if (
      window.confirm(
        `Permanently delete user "${email}"? This cannot be undone.`,
      )
    ) {
      deleteUser(userId, {
        onSuccess: () => toast.success(`"${email}" deleted successfully`),
        onError: (err: unknown) =>
          toast.error(
            (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error ?? "Failed to delete user",
          ),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-white">Users</h1>
        <p className="text-golden/80 text-sm mt-1">
          {data?.total ?? 0} total users registered.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to page 1 whenever the search changes
          }}
          className="input-field pl-9"
          placeholder="Search by name or email..."
        />
      </div>

      {/* Users table */}
      <div className="bg-[#1E293B] rounded-xl border border-slate-700/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    User
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Role
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Joined
                  </th>
                  <th className="text-left text-slate-400 font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data?.users?.map((u: AdminUser) => {
                  // Is this row the currently logged-in admin?
                  // If yes, we disable action buttons to prevent self-modification
                  const isSelf = u._id === currentUser?.id;

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-700/20 transition-colors"
                    >
                      {/* User name + email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {/* Avatar circle with initials */}
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
                            {u.firstName?.charAt(0)}
                            {u.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {u.firstName} {u.lastName}
                              {/* Show 'You' badge next to the logged-in admin's row */}
                              {isSelf && (
                                <span className="ml-2 px-1.5 py-0.5 bg-burgundy/80 text-text-light text-xs rounded">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {/* Role badge — golden for admin, grey for regular user */}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium
                          ${u.role === "admin" ? "bg-golden/80 text-black" : "bg-slate-700 text-slate-300"}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Role toggle button — disabled for own account */}
                          <button
                            onClick={() => handleRoleToggle(u._id, u.role)}
                            disabled={isSelf || isUpdatingRole}
                            title={
                              u.role === "admin" ? "Revoke admin" : "Make admin"
                            }
                            className="p-2 text-slate-400 hover:text-text-dark hover:bg-golden/80
                              rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            {u.role === "admin" ? (
                              <ShieldOff size={15} />
                            ) : (
                              <Shield size={15} />
                            )}
                          </button>
                          {/* Delete button — disabled for own account */}
                          <button
                            onClick={() => handleDelete(u._id, u.email)}
                            disabled={isSelf || isDeletingUser}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10
                              rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {data?.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-slate-400 text-sm">
              Page {data.currentPage} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === data.totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";

// Import our author hooks
import { useCreateAuthor, useUpdateAuthor } from "../../hooks/useAuthors";
import AdminModal from "../ui/AdminModal";

import type { IAuthor } from "../../types/book";

interface AuthorFormModalProps {
  author?: IAuthor | null;
  onClose: () => void;
}

const AuthorForm = ({ author, onClose }: AuthorFormModalProps) => {
  const isEditing = !!author;

  // Form state — pre-fill with existing values if editing
  const [name, setName] = useState(author?.name ?? "");
  const [bio, setBio] = useState(author?.bio ?? "");
  const [specialty, setSpecialty] = useState(
    author?.specialty?.join(", ") ?? "",
  );
  const [nationality, setNationality] = useState(author?.nationality ?? "");
  const [website, setWebsite] = useState(author?.website ?? "");
  const [twitter, setTwitter] = useState(author?.socialLinks?.twitter ?? "");
  const [linkedin, setLinkedin] = useState(author?.socialLinks?.linkedin ?? "");
  const [github, setGithub] = useState(author?.socialLinks?.github ?? "");
  const [goodreads, setGoodreads] = useState(
    author?.socialLinks?.goodreads ?? "",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { mutateAsync: createAuthor } = useCreateAuthor();
  const { mutateAsync: updateAuthor } = useUpdateAuthor();

  const handleSubmit = async () => {
    setError("");

    // Client-side guard — avatar is required on create
    if (!isEditing && !avatarFile) {
      setError("Author avatar image is required.");
      return;
    }

    setLoading(true);

    try {
      // Build FormData — backend expects multipart because of the avatar file
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);

      // specialty is sent as a JSON string — backend parses it into an array
      const specialtyArray = specialty
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      formData.append("specialty", JSON.stringify(specialtyArray));

      // Optional text fields — only append if they have values
      if (nationality) formData.append("nationality", nationality);
      if (website) formData.append("website", website);
      if (twitter) formData.append("twitter", twitter);
      if (linkedin) formData.append("linkedin", linkedin);
      if (github) formData.append("github", github);
      if (goodreads) formData.append("goodreads", goodreads);

      // Avatar file — field name must be 'avatar' to match multer config
      if (avatarFile) formData.append("avatar", avatarFile);

      if (isEditing) {
        await updateAuthor({ authorId: author._id, formData });
      } else {
        await createAuthor(formData);
      }
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error ??
          (isEditing ? "Failed to update author" : "Failed to create author"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminModal
      title={isEditing ? "Edit Author" : "Add New Author"}
      onClose={onClose}
      disableClose={loading}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Author full name"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Bio * (min 20 chars)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="input-field resize-none"
            rows={4}
            placeholder="Author biography..."
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Specialties (comma-separated)
          </label>
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="input-field"
            placeholder="Self-help, Psychology, Philosophy"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Nationality
            </label>
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="input-field"
              placeholder="American"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Website
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <p className="text-slate-400 text-sm mb-2">Social Links (optional)</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Twitter", value: twitter, set: setTwitter },
              { label: "LinkedIn", value: linkedin, set: setLinkedin },
              { label: "GitHub", value: github, set: setGithub },
              { label: "Goodreads", value: goodreads, set: setGoodreads },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-slate-500 text-xs mb-1">
                  {label}
                </label>
                <input
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://..."
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">
            Avatar Image {isEditing ? "(leave empty to keep current)" : "*"}
          </label>
          {isEditing && author?.avatar && (
            <img
              src={author.avatar}
              alt={author.name}
              className="mb-2 h-16 w-16 rounded-full border border-slate-600 object-cover"
            />
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
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
                : "Adding author..."
              : isEditing
                ? "Save Changes"
                : "Add Author"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
};

export default AuthorForm;

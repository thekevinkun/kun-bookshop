// Self-contained searchable author dropdown
// Uses Radix Popover (already installed) + plain input — no MantineProvider needed
import { useState, useRef, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import { ChevronDown, Search, X } from "lucide-react";

interface AuthorOption {
  _id: string; // The value stored in form state
  name: string; // The label shown to the admin
}

interface AuthorSelectProps {
  authors: AuthorOption[] | undefined; // Full author list from useAllAuthors
  value: string; // Currently selected author _id
  onChange: (value: string) => void; // Called when admin picks or clears
  placeholder?: string;
}

const AuthorSelect = ({
  authors,
  value,
  onChange,
  placeholder = "Search or select an author...",
}: AuthorSelectProps) => {
  // Whether the dropdown panel is open
  const [open, setOpen] = useState(false);

  // What the admin has typed in the search input
  const [search, setSearch] = useState("");

  // Ref to auto-focus the search input when the dropdown opens
  const searchRef = useRef<HTMLInputElement>(null);

  // Derive the display label from the selected value
  // Falls back to placeholder if nothing is selected yet
  const selectedLabel = authors?.find((a) => a._id === value)?.name ?? "";

  // Filter authors by the search string — case-insensitive substring match
  const filtered =
    authors?.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];

  // Auto-focus the search input every time the dropdown opens
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        searchRef.current?.focus();
      });
    }
  }, [open]);

  const handleSelect = (authorId: string) => {
    onChange(authorId); // Lift the new value up to BookForm state
    setOpen(false); // Close the dropdown after selection
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger the trigger button's onClick
    onChange(""); // Reset form state
    setSearch("");
  };

  return (
    <Popover.Root
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setSearch("");
        }
      }}
    >
      {/* Trigger — looks like a select input */}
      <Popover.Trigger asChild>
        <button
          type="button"
          // input-field class matches all other inputs in the form
          className="input-field flex items-center justify-between text-left w-full"
        >
          {/* Show selected name or grey placeholder */}
          <span className={selectedLabel ? "text-slate-100" : "text-slate-400"}>
            {selectedLabel || placeholder}
          </span>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {/* Clear button — only shown when something is selected */}
            {value && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 text-slate-400 hover:text-slate-200 rounded"
              >
                <X size={14} />
              </span>
            )}
            {/* Chevron rotates when open */}
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-150 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>
      </Popover.Trigger>

      {/* Dropdown panel — rendered in a portal so it's never clipped by overflow:hidden */}
      <Popover.Portal>
        <Popover.Content
          // Match the trigger width exactly
          style={{ width: "var(--radix-popover-trigger-width)" }}
          sideOffset={4}
          className="z-50 bg-[#1E293B] border border-slate-700 rounded-xl shadow-xl
            overflow-hidden animate-in fade-in-0 zoom-in-95"
        >
          {/* Search input at the top of the dropdown */}
          <div className="p-2 border-b border-slate-700">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg
                  pl-8 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500
                  focus:outline-none"
              />
            </div>
          </div>

          {/* Scrollable list of matching authors */}
          <div
            className="max-h-52 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {filtered.length === 0 ? (
              // Empty state — shown when search returns nothing
              <p className="text-slate-500 text-sm text-center py-4">
                No authors match "{search}"
              </p>
            ) : (
              filtered.map((author) => (
                <button
                  key={author._id}
                  type="button"
                  onClick={() => handleSelect(author._id)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                    ${
                      author._id === value
                        ? "bg-teal-500/20 text-teal-300" // Highlight currently selected
                        : "text-slate-200 hover:bg-slate-700/60"
                    }`}
                >
                  {author.name}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default AuthorSelect;

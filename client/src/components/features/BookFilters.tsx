import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { useAutocomplete } from "../../hooks/useBooks";
import { useDebouncedValue } from "@mantine/hooks";

import type { BookFilters } from "../../types/book";

interface BookFiltersProps {
  // Current active filters — controlled from the parent page
  filters: BookFilters;
  // Called whenever the user changes any filter
  onChange: (filters: BookFilters) => void;
}

// Available categories — in a real app these could come from the API
const CATEGORIES = [
  "Fiction",
  "Non-Fiction",
  "Mystery",
  "Thriller",
  "Romance",
  "Science Fiction",
  "Fantasy",
  "Biography",
  "Self-Help",
  "History",
  "Business",
  "Technology",
];

const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt", order: "desc" },
  { label: "Oldest", value: "createdAt", order: "asc" },
  { label: "Price: Low to High", value: "price", order: "asc" },
  { label: "Price: High to Low", value: "price", order: "desc" },
  { label: "Top Rated", value: "rating", order: "desc" },
  { label: "Bestselling", value: "purchaseCount", order: "desc" },
];

const BookFiltersComponent = ({ filters, onChange }: BookFiltersProps) => {
  // Local search input value — we debounce before passing to the parent
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Whether the mobile filter panel is open
  const [showFilters, setShowFilters] = useState(false);

  // Debounce the search input by 400ms so we don't fire on every keystroke
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);

  // Fetch autocomplete suggestions based on the debounced value
  const { data: suggestions = [] } = useAutocomplete(debouncedSearch);

  // Whether to show the autocomplete dropdown
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Update a single filter key without wiping the rest
  const updateFilter = (
    key: keyof BookFilters,
    value: string | number | undefined,
  ) => {
    onChange({
      ...filters,
      [key]: value,
      // Reset to page 1 whenever a filter changes
      page: 1,
    });
  };

  // Clear all active filters back to defaults
  const clearFilters = () => {
    setSearchInput("");
    onChange({ page: 1, sortBy: "createdAt", sortOrder: "desc" });
  };

  // Count how many non-default filters are currently active
  // Used to show a badge on the filter button
  const activeFilterCount = [
    filters.category,
    filters.fileType,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 mb-8">
      {/* --- TOP ROW: search + filter toggle + sort --- */}
      <div className="flex gap-3 items-center">
        {/* Search bar with autocomplete */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search by title or author..."
            className="input-field pl-9 pr-4"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
              // Pass the search to parent immediately as user types
              updateFilter("search", e.target.value);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding so clicks on suggestions register first
              setTimeout(() => setShowSuggestions(false), 150);
            }}
          />

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-bg-hover
                rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {suggestions.map((book) => (
                <button
                  key={book._id}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover
                    text-left transition-colors duration-150"
                  onClick={() => {
                    setSearchInput(book.title);
                    updateFilter("search", book.title);
                    setShowSuggestions(false);
                  }}
                >
                  {/* Small cover thumbnail in the dropdown */}
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-8 h-10 object-cover rounded"
                  />
                  <div>
                    <p className="text-text-light text-sm font-medium">
                      {book.title}
                    </p>
                    <p className="text-text-muted text-xs">{book.authorName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filter toggle button — shows badge with active filter count */}
        <button
          className="btn-ghost btn-sm relative flex items-center gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-4 h-4 bg-teal text-white
                text-xs rounded-full flex items-center justify-center"
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort dropdown */}
        <select
          className="input-field w-auto cursor-pointer"
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const option = SORT_OPTIONS.find(
              (o) => `${o.value}-${o.order}` === e.target.value,
            );
            if (option) {
              onChange({
                ...filters,
                sortBy: option.value as BookFilters["sortBy"],
                sortOrder: option.order as BookFilters["sortOrder"],
                page: 1,
              });
            }
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option
              key={`${opt.value}-${opt.order}`}
              value={`${opt.value}-${opt.order}`}
            >
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* --- EXPANDED FILTER PANEL --- */}
      {showFilters && (
        <div className="card-base flex flex-col sm:flex-row gap-6">
          {/* Category filter */}
          <div className="flex-1">
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`text-xs px-3 py-1 rounded-full border transition-all duration-150
                    ${
                      filters.category === cat
                        ? "bg-teal text-white border-teal"
                        : "border-bg-hover text-text-muted hover:border-teal hover:text-teal"
                    }`}
                  onClick={() =>
                    // Clicking the active category deselects it
                    updateFilter(
                      "category",
                      filters.category === cat ? undefined : cat,
                    )
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Right column: file type + price range */}
          <div className="flex flex-col gap-4 sm:w-56">
            {/* File type filter */}
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                Format
              </p>
              <div className="flex gap-2">
                {(["pdf", "epub"] as const).map((type) => (
                  <button
                    key={type}
                    className={`flex-1 text-xs py-1.5 rounded-lg border uppercase transition-all duration-150
                      ${
                        filters.fileType === type
                          ? "bg-teal text-white border-teal"
                          : "border-bg-hover text-text-muted hover:border-teal hover:text-teal"
                      }`}
                    onClick={() =>
                      updateFilter(
                        "fileType",
                        filters.fileType === type ? undefined : type,
                      )
                    }
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
                Price Range
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="input-field text-sm py-1.5"
                  min={0}
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    updateFilter(
                      "minPrice",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
                <span className="text-text-muted text-xs">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  className="input-field text-sm py-1.5"
                  min={0}
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    updateFilter(
                      "maxPrice",
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </div>

            {/* Clear filters button — only shows when something is active */}
            {activeFilterCount > 0 && (
              <button
                className="btn-ghost btn-sm flex items-center gap-2 self-start"
                onClick={clearFilters}
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookFiltersComponent;

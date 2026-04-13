// Import React hooks for state management
import { useState, useEffect, useRef } from "react";

// Import React Router hook to read URL query params
import { useSearchParams } from "react-router-dom";

// Import icons for the search bar and filter panel
import { Search, SlidersHorizontal, X } from "lucide-react";

// Import our hooks — useAutocomplete for search suggestions
import { useAutocomplete } from "../../hooks/useBooks";
import { BOOK_CATEGORY_BUCKETS } from "../../constants/bookCategoryBuckets";

// Import useDebouncedValue — delays search so we don't fire on every keystroke
import { useDebouncedValue } from "@mantine/hooks";

// Import the BookFilters type that defines the shape of our filter state
import type { BookFilters, IBook } from "../../types/book";

interface BookFiltersProps {
  filters: BookFilters;
  onChange: (filters: BookFilters) => void;
}

// Sort options — these don't come from the DB, they're fixed UI choices
const SORT_OPTIONS = [
  { label: "Newest", value: "createdAt", order: "desc" },
  { label: "Oldest", value: "createdAt", order: "asc" },
  { label: "Price: Low to High", value: "price", order: "asc" },
  { label: "Price: High to Low", value: "price", order: "desc" },
  { label: "Top Rated", value: "rating", order: "desc" },
  { label: "Bestselling", value: "purchaseCount", order: "desc" },
];

const BookFiltersComponent = ({ filters, onChange }: BookFiltersProps) => {
  // This lets us detect clicks outside the whole search/filter area.
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read URL search params so we can initialize filters from the URL
  // e.g. /books?sortBy=purchaseCount&sortOrder=desc sets the sort dropdown correctly
  const [searchParams] = useSearchParams();

  // Local search input — raw value before debounce
  const [searchInput, setSearchInput] = useState(
    filters.search || searchParams.get("search") || "",
  );

  // Whether the expanded filter panel is visible
  const [showFilters, setShowFilters] = useState(false);

  // Whether the autocomplete dropdown is visible
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce the search input — only update after 400ms of no typing
  const [debouncedSearch] = useDebouncedValue(searchInput, 400);

  // Fetch autocomplete suggestions from the real API
  const { data: suggestions = [] } = useAutocomplete(debouncedSearch);

  // When the component mounts, apply any filters that were set via URL params
  // This makes navigating from DiscountSection (?sortBy=rating) work correctly
  useEffect(() => {
    const urlSortBy = searchParams.get("sortBy") as
      | BookFilters["sortBy"]
      | null;
    const urlSortOrder = searchParams.get("sortOrder") as
      | BookFilters["sortOrder"]
      | null;
    const urlSearch = searchParams.get("search");
    const urlCategory = searchParams.get("category");
    const urlCategoryBucket = searchParams.get("categoryBucket");
    const urlAuthor = searchParams.get("author");

    // Only apply if any URL params are present — don't override existing filter state
    if (
      urlSortBy ||
      urlSortOrder ||
      urlSearch ||
      urlCategory ||
      urlCategoryBucket ||
      urlAuthor
    ) {
      onChange({
        ...filters,
        ...(urlSortBy && { sortBy: urlSortBy }),
        ...(urlSortOrder && { sortOrder: urlSortOrder }),
        ...(urlSearch && { search: urlSearch }),
        ...(urlCategory && { category: urlCategory }),
        ...(urlCategoryBucket && { categoryBucket: urlCategoryBucket }),
        page: 1,
      });
      if (urlSearch) setSearchInput(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only runs once on mount — intentional

  // Update a single filter key without wiping the rest
  const updateFilter = (
    key: keyof BookFilters,
    value: string | number | undefined,
  ) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  // This applies the current input text to the real catalog search.
  const applySearch = (value: string) => {
    const trimmedValue = value.trim();
    onChange({
      ...filters,
      search: trimmedValue ? trimmedValue : undefined,
      page: 1,
    });
    setShowSuggestions(false);
  };

  // Reset everything back to defaults
  const clearFilters = () => {
    setSearchInput("");
    onChange({ page: 1, limit: 15, sortBy: "createdAt", sortOrder: "desc" });
  };

  useEffect(() => {
    // This closes floating panels when the user clicks somewhere else.
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  // Count active non-default filters to show on the badge
  const activeFilterCount = [
    filters.category,
    filters.categoryBucket,
    filters.fileType,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div ref={containerRef} className="relative z-30 flex flex-col gap-4 mb-8">
      {/* ── Top row: search + filter toggle + sort ── */}
      <div className="flex gap-3 items-center">
        {/* Search bar */}
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
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => {
              // This lets Enter commit the search without clicking a suggestion.
              if (e.key === "Enter") {
                e.preventDefault();
                applySearch(searchInput);
              }
            }}
          />

          {/* Autocomplete dropdown — shows real book suggestions from the API */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute top-full left-0 right-0 mt-1 bg-card border border-bg-hover
                            rounded-lg shadow-xl z-50 overflow-hidden"
            >
              {suggestions.map((book: IBook) => (
                <button
                  key={book._id}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-bg-hover
                    text-left transition-colors duration-150"
                  onClick={() => {
                    setSearchInput(book.title);
                    // This commits the clicked suggestion to the catalog.
                    applySearch(book.title);
                  }}
                >
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

        {/* Filter toggle button */}
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

      {/* ── Expanded filter panel ── */}
      {showFilters && (
        <div
          // This makes the filter panel float instead of pushing the catalog down.
          className="absolute left-0 right-0 top-full mt-2 card-base flex flex-col sm:flex-row gap-6 z-40 shadow-2xl"
        >
          {/* Category filter — curated browse buckets */}
          <div className="flex-1">
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {BOOK_CATEGORY_BUCKETS.map((bucket) => (
                <button
                  key={bucket.key}
                  className={`text-xs px-3 py-1 rounded-full border transition-all duration-150
                    ${
                      filters.categoryBucket === bucket.key
                        ? "bg-teal text-white border-teal"
                        : "border-bg-hover text-text-muted hover:border-teal hover:text-teal"
                    }`}
                  onClick={() =>
                    onChange({
                      ...filters,
                      category: undefined,
                      categoryBucket:
                        filters.categoryBucket === bucket.key
                          ? undefined
                          : bucket.key,
                      page: 1,
                    })
                  }
                >
                  {bucket.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right column: format + price range + clear */}
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

            {/* Clear all */}
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

import * as RadixTabs from "@radix-ui/react-tabs";
import {
  Star,
  FileText,
  Download,
  BookOpen,
  Calendar,
  Tag,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { IBook } from "../../types/book";
import { PLACEHOLDER_REVIEWS } from "../../lib/data";

interface BookDetailTabsProps {
  book: IBook;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

// Helper: resolve the display name whether author is a string or populated object
const resolveAuthorName = (author: IBook["author"]): string => {
  if (!author) return "Unknown";
  if (typeof author === "string") return author;
  return author.name;
};

const BookDetailTabs = ({ book }: BookDetailTabsProps) => {
  const navigate = useNavigate();
  const authorName = resolveAuthorName(book.author);

  return (
    // Radix Tabs root — manages which tab is active
    // defaultValue sets which tab is open on first render
    <RadixTabs.Root defaultValue="summary" className="flex flex-col gap-0">
      {/* ---- TAB HEADER ROW ---- */}
      {/* RadixTabs.List is the accessible tab bar — handles keyboard nav automatically */}
      <RadixTabs.List
        className="flex border-b border-bg-hover mb-6"
        aria-label="Book details"
      >
        {[
          { value: "summary", label: "Summary" },
          {
            value: "reviews",
            label: `Reviews (${book.reviewCount || PLACEHOLDER_REVIEWS.length})`,
          },
          { value: "author", label: "Author Info" },
        ].map((tab) => (
          // RadixTabs.Trigger — each clickable tab button
          // Radix handles aria-selected, keyboard focus, and activation automatically
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="relative px-5 py-3 text-sm font-semibold transition-all duration-200
              text-text-muted hover:text-text-light data-[state=active]:text-teal
              focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
          >
            {tab.label}

            {/* Animated underline — only visible on the active tab */}
            {/* We use a pseudo-element approach via a span so we can animate it */}
            <span
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-teal
                scale-x-0 transition-transform duration-200 [[data-state=active]_&]:scale-x-100"
            />
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {/* SUMMARY TAB */}
      <RadixTabs.Content value="summary" className="focus:outline-none">
        <div className="flex flex-col gap-4">
          <p className="text-text-muted leading-relaxed text-sm">
            {book.description}
          </p>

          {/* Detail chips grid */}
          <div className="grid grid-cols-2 gap-3 mt-2">
            {[
              {
                icon: <FileText size={14} className="text-teal" />,
                label: "Format",
                value: book.fileType.toUpperCase(),
              },
              {
                icon: <Download size={14} className="text-teal" />,
                label: "File Size",
                value: formatFileSize(book.fileSize),
              },
              {
                icon: <BookOpen size={14} className="text-teal" />,
                label: "Category",
                value: book.category[0],
              },
              {
                icon: <Calendar size={14} className="text-teal" />,
                label: "Published",
                value: formatDate(book.publishedDate) ?? "N/A",
              },
              {
                icon: <Tag size={14} className="text-teal" />,
                label: "ISBN",
                value: book.isbn ?? "N/A",
              },
              {
                icon: <Star size={14} className="text-teal" />,
                label: "Purchases",
                value: book.purchaseCount.toLocaleString(),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 bg-bg-dark rounded-lg px-3 py-2"
              >
                {item.icon}
                <div>
                  <p className="text-text-muted text-xs">{item.label}</p>
                  <p className="text-text-light text-xs font-semibold">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {book.tags.map((tag) => (
                <span key={tag} className="badge-primary text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </RadixTabs.Content>

      {/* REVIEWS TAB */}
      <RadixTabs.Content value="reviews" className="focus:outline-none">
        <div className="flex flex-col gap-4">
          {/* Rating summary card */}
          <div className="flex items-center gap-4 p-4 bg-bg-dark rounded-xl">
            <div className="text-center">
              <p className="text-teal text-5xl font-black leading-none">
                {book.rating.toFixed(1)}
              </p>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i < Math.round(book.rating)
                        ? "text-warning fill-warning"
                        : "text-bg-hover fill-bg-hover"
                    }
                  />
                ))}
              </div>
              <p className="text-text-muted text-xs mt-1">
                {book.reviewCount} reviews
              </p>
            </div>

            {/* Rating distribution bars */}
            <div className="flex-1 flex flex-col gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-text-muted text-xs w-3">{star}</span>
                  <div className="flex-1 bg-bg-hover rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-500"
                      style={{
                        width:
                          star === 5
                            ? "65%"
                            : star === 4
                              ? "20%"
                              : star === 3
                                ? "10%"
                                : star === 2
                                  ? "3%"
                                  : "2%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Individual review cards */}
          <div className="flex flex-col gap-4">
            {PLACEHOLDER_REVIEWS.map((review) => (
              <div
                key={review.id}
                className="flex flex-col gap-2 pb-4 border-b border-bg-hover last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Initials avatar */}
                    <div
                      className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30
                        flex items-center justify-center text-teal text-xs font-bold"
                    >
                      {review.name[0]}
                    </div>
                    <div>
                      <p className="text-text-light text-sm font-semibold">
                        {review.name}
                      </p>
                      <p className="text-text-muted text-xs">{review.date}</p>
                    </div>
                  </div>

                  {/* Star rating for this review */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={
                          i < review.rating
                            ? "text-warning fill-warning"
                            : "text-bg-hover fill-bg-hover"
                        }
                      />
                    ))}
                  </div>
                </div>
                <p className="text-text-muted text-sm leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        </div>
      </RadixTabs.Content>

      {/* AUTHOR TAB */}
      <RadixTabs.Content value="author" className="focus:outline-none">
        <div className="flex flex-col gap-5">
          {/* Author card — shows populated data if available */}
          <div className="flex items-start gap-4 p-4 bg-bg-dark rounded-xl">
            {/* Avatar — real photo if author is populated, icon otherwise */}
            {typeof book.author === "object" && book.author?.avatar ? (
              <img
                src={book.author.avatar}
                alt={authorName}
                className="w-16 h-16 rounded-full object-cover border-2 border-teal/30 flex-shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full bg-teal/20 border-2 border-teal/30
                  flex items-center justify-center flex-shrink-0"
              >
                <User size={28} className="text-teal" />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <h3 className="text-text-light font-bold text-lg">
                {authorName}
              </h3>

              {/* Specialty — from populated author or fallback to book category */}
              <p className="text-teal text-xs font-semibold uppercase tracking-wider">
                {typeof book.author === "object" &&
                book.author?.specialty?.length
                  ? book.author.specialty[0]
                  : book.category[0]}{" "}
                Author
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-1">
                {[
                  {
                    value: `${book.purchaseCount.toLocaleString()}+`,
                    label: "Readers",
                  },
                  { value: `${book.rating.toFixed(1)}★`, label: "Avg Rating" },
                  { value: String(book.reviewCount), label: "Reviews" },
                ].map((stat, i, arr) => (
                  <div key={stat.label} className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-text-light font-bold text-sm">
                        {stat.value}
                      </p>
                      <p className="text-text-muted text-xs">{stat.label}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-px h-8 bg-bg-hover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bio — real if author populated, generated otherwise */}
          {typeof book.author === "object" && book.author?.bio ? (
            <p className="text-text-muted text-sm leading-relaxed">
              {book.author.bio}
            </p>
          ) : (
            <>
              <p className="text-text-muted text-sm leading-relaxed">
                <span className="text-text-light font-semibold">
                  {authorName}
                </span>{" "}
                is a renowned author and expert in{" "}
                {book.category[0].toLowerCase()}. With years of experience and a
                passion for sharing knowledge, their works have helped thousands
                of readers worldwide advance their careers.
              </p>
              <p className="text-text-muted text-sm leading-relaxed">
                <span className="text-text-light italic">{book.title}</span> is
                one of their most celebrated works — praised for its clarity,
                depth, and practical approach.
              </p>
            </>
          )}

          {/* Social links — only shown when author is populated */}
          {typeof book.author === "object" && book.author?.socialLinks && (
            <div className="flex gap-3">
              {Object.entries(book.author.socialLinks)
                .filter(([, url]) => typeof url === "string" && url.length > 0)
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost btn-sm capitalize"
                  >
                    {platform}
                  </a>
                ))}
            </div>
          )}

          <button
            className="btn-ghost btn-sm self-start flex items-center gap-2"
            onClick={() => navigate(`/books?search=${authorName}`)}
          >
            <BookOpen size={14} />
            Browse more by {authorName.split(" ")[0]}
          </button>
        </div>
      </RadixTabs.Content>
    </RadixTabs.Root>
  );
};

export default BookDetailTabs;

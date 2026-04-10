import type { IBook, Coupon } from "../types/book";
import { toast } from "sonner";

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
};

// Format a date string into a readable short format
// e.g. "2026-04-06T10:00:00Z" → "Apr 6, 2026"
export const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const resolveAuthorName = (author: IBook["author"]): string => {
  if (!author) return "Unknown";
  if (typeof author === "string") return author;
  return author.name;
};

export const getDefaultValidUntil = () => {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
};

// Share helpers
// These build the pre-filled share URLs for each social platform
// The admin clicks the button and the platform opens with the message pre-filled

const buildShareText = (coupon: Coupon): string => {
  // Build a human-readable discount description
  const discount =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `$${coupon.discountValue} off`;

  const expiry = new Date(coupon.validUntil).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `📚 Get ${discount} at Kun Bookshop! Use code: ${coupon.code} — valid until ${expiry}. Shop now 👉 ${window.location.origin}/books`;
};

export const shareOnX = (coupon: Coupon) => {
  // X (Twitter) share URL — t parameter is the pre-filled tweet text
  const text = encodeURIComponent(buildShareText(coupon));
  window.open(`https://x.com/intent/tweet?text=${text}`, "_blank");
};

export const shareOnFacebook = (coupon: Coupon) => {
  // Facebook share URL — u parameter is the URL to share (they pull OG tags from it)
  // We pass our books page URL and the coupon text as a quote
  const url = encodeURIComponent(`${window.location.origin}/books`);
  const quote = encodeURIComponent(buildShareText(coupon));
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`,
    "_blank",
  );
};

export const shareOnInstagram = (coupon: Coupon) => {
  // Instagram has no web share API — copy the text to clipboard instead
  // The admin can then paste it into their Instagram app
  navigator.clipboard.writeText(buildShareText(coupon));
  toast.success("Caption copied! Open Instagram and paste it into your post.");
};

import multer from "multer";

// fileTypeFromBuffer checks the actual file bytes — not just the extension
// This prevents attackers from renaming a .exe to .pdf and uploading it
import { fileTypeFromBuffer } from "file-type";
import { Request, Response, NextFunction } from "express";

// ALLOWED FILE TYPES
// These are the only MIME types we accept for book files and cover images
const ALLOWED_BOOK_TYPES = [
  "application/pdf",
  "application/epub+zip", // ePub files are actually zip archives internally
];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// FILE SIZE LIMITS
const MAX_BOOK_SIZE = 50 * 1024 * 1024; // 50MB — enough for any book file
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; //  5MB — covers don't need to be huge

// MULTER STORAGE
// We use memoryStorage so the file lands in RAM as a Buffer
// This lets us run magic byte checks BEFORE doing anything else with the file
// We never write to disk — files go straight to Cloudinary after verification
const storage = multer.memoryStorage();

// MULTER FILTER
// This runs before the file is fully received — it's a first-pass MIME check
// based on what the browser CLAIMS the file is (not fully trusted yet)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  // Combine allowed types to check both book files and images in one filter
  const allAllowedTypes = [...ALLOWED_BOOK_TYPES, ...ALLOWED_IMAGE_TYPES];

  if (allAllowedTypes.includes(file.mimetype)) {
    // Claim looks valid — accept the file and let magic byte check confirm it
    cb(null, true);
  } else {
    // Reject immediately if the browser claims an unexpected MIME type
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

// MULTER INSTANCE FOR BOOKS
// Handles 'file' (book) + 'coverImage' fields with the 50MB book limit
export const uploadBookFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BOOK_SIZE }, // 50MB — for book files
}).fields([
  { name: "file", maxCount: 1 }, // Book file (PDF/ePub)
  { name: "coverImage", maxCount: 1 }, // Book cover image
]);

// MULTER INSTANCE FOR AUTHORS
// Separate instance with the smaller 5MB image limit — avatars don't need 50MB headroom
// Using uploadBookFiles for authors was applying the 50MB book limit to avatar uploads
// which caused multer to behave unexpectedly on some image sizes
export const uploadAuthorFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }, // 5MB — avatars are images only
}).fields([
  { name: "avatar", maxCount: 1 }, // Author avatar image
]);

// MAGIC BYTE VERIFICATION MIDDLEWARE
// This runs AFTER multer — files are now in req.files as Buffers
// We inspect the actual bytes to confirm the file is really what it claims to be
export const verifyFileTypes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If no files were uploaded, skip this check (some updates don't change files)
  if (!req.files || typeof req.files !== "object") {
    return next();
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // VERIFY AUTHOR AVATAR
  // Same rules as cover images — must be a real JPEG, PNG, or WebP
  if (files.avatar && files.avatar[0]) {
    const avatarFile = files.avatar[0];

    // Check avatar file size against the image limit
    if (avatarFile.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        error: `Avatar image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Read the magic bytes to confirm it's really an image
    const detectedType = await fileTypeFromBuffer(avatarFile.buffer);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
      return res.status(400).json({
        error: "Avatar must be a valid JPEG, PNG, or WebP file",
      });
    }
  }

  // VERIFY BOOK FILE
  if (files.file && files.file[0]) {
    const bookFile = files.file[0];

    // Check the actual file size against our book limit
    if (bookFile.size > MAX_BOOK_SIZE) {
      return res.status(400).json({
        error: `Book file too large. Maximum size is ${MAX_BOOK_SIZE / 1024 / 1024}MB`,
      });
    }

    // Read the magic bytes from the Buffer to detect the real file type
    const detectedType = await fileTypeFromBuffer(bookFile.buffer);

    // If we can't detect a type, or it's not in our allowed list — reject it
    if (!detectedType || !ALLOWED_BOOK_TYPES.includes(detectedType.mime)) {
      return res.status(400).json({
        error:
          "Book file must be a valid PDF or ePub — file content does not match",
      });
    }
  }

  // VERIFY COVER IMAGE
  if (files.coverImage && files.coverImage[0]) {
    const imageFile = files.coverImage[0];

    // Check image file size separately with the stricter image limit
    if (imageFile.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        error: `Cover image too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Read the magic bytes to confirm it's really an image
    const detectedType = await fileTypeFromBuffer(imageFile.buffer);

    if (!detectedType || !ALLOWED_IMAGE_TYPES.includes(detectedType.mime)) {
      return res.status(400).json({
        error: "Cover image must be a valid JPEG, PNG, or WebP file",
      });
    }
  }

  // All checks passed — move on to the controller
  next();
};

// MULTER INSTANCE FOR USER AVATARS
// Separate instance for profile avatar uploads — same 5MB limit as author avatars
// Field name is 'avatar' — must match what the frontend sends in FormData
export const uploadAvatarFile = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE }, // 5MB — profile photos don't need more
}).fields([
  { name: "avatar", maxCount: 1 }, // Single avatar image
]);

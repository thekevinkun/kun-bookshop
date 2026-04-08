// Mirror of server/src/types/book.ts
// The frontend can't import from the server directly, so we duplicate the types here
export interface IBook {
  _id: string;
  title: string;
  author:
    | string
    | {
        _id: string;
        name: string;
        avatar: string;
        specialty: string[];
        bio?: string;
        website?: string;
        socialLinks?: {
          twitter?: string | null;
          linkedin?: string | null;
          facebook?: string | null;
          instagram?: string | null;
        };
      };
  authorName: string;
  description: string;
  price: number;
  discountPrice?: number;
  coverImage: string;
  fileUrl: string;
  fileType: "pdf" | "epub";
  fileSize: number;
  isbn?: string;
  category: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  purchaseCount: number;
  isFeatured: boolean;
  isActive: boolean;
  publishedDate?: string;
  previewPages?: number;
  videoUrl?: string;
  filePublicId?: string;
  coverPublicId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fileType?: "pdf" | "epub";
  search?: string;
  sortBy?: "createdAt" | "price" | "rating" | "purchaseCount";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginatedBooks {
  books: IBook[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IReview {
  _id: string;
  bookId: {
    _id: string;
    title: string;
    authorName: string;
  };
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  rating: number;
  comment: string;
  isPurchaseVerified: boolean;
  helpfulCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthor {
  _id: string;
  name: string;
  bio: string;
  avatar: string;
  specialty: string[];
  nationality?: string;
  website?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDownloadRecord {
  _id: string;
  bookId: IBook; // Populated by the backend with the book's title and authorName
  downloadedAt: string;
}

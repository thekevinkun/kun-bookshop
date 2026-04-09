// Define the GraphQL type system for Books
// This is a showcase feature — read-only, no mutations for users
export const typeDefs = `#graphql

  # The main Book type — mirrors our MongoDB Book model
  type Book {
    id: ID!
    title: String!
    author: String!
    description: String!
    price: Float!
    discountPrice: Float
    coverImage: String!
    fileType: String!
    fileSize: Int!
    isbn: String
    category: [String!]!
    tags: [String!]!
    rating: Float!
    reviewCount: Int!
    purchaseCount: Int!
    isFeatured: Boolean!
    publishedDate: String
    previewPages: Int
    createdAt: String!
    updatedAt: String!
  }

  # Wrapper for paginated book lists — includes pagination metadata
  type BookConnection {
    books: [Book!]!
    total: Int!
    currentPage: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  # Represents a single review document returned by the GraphQL API.
  # Mirrors the REST /api/reviews/:bookId response shape.
  type Review {
    id: ID!                   # MongoDB _id as a string
    bookId: ID!               # Which book this review belongs to
    userId: ID!               # Who wrote it
    authorName: String!       # Reviewer's display name — populated from User (firstName + lastName)
    rating: Int!              # 1–5 stars
    comment: String!          # Review body text
    isPurchaseVerified: Boolean! # Set server-side — true if the reviewer owns the book
    helpfulCount: Int!        # Number of helpful votes
    isActive: Boolean!        # Soft-delete flag — false means deleted
    createdAt: String!        # ISO date string
  }

  # Paginated review connection — mirrors the REST pagination shape
  type ReviewConnection {
    reviews: [Review!]!  # The reviews for this page
    totalCount: Int!     # Total reviews matching the query (for pagination UI)
    avgRating: Float!    # Average rating across all reviews for this book
  }

  # All available read queries
  type Query {
    # Get paginated books with optional filters
    books(
      page: Int
      limit: Int
      category: String
      search: String
      sortBy: String
      sortOrder: String
    ): BookConnection!

    # Get a single book by its MongoDB ID
    book(id: ID!): Book

    # Get featured books for the homepage carousel
    featuredBooks: [Book!]!

    # Search books by title or author — returns up to 6 suggestions
    searchBooks(query: String!, limit: Int): [Book!]!

    # Get books filtered by a single category
    booksByCategory(category: String!, limit: Int): [Book!]!

    # Get paginated reviews for a specific book# 
    bookReviews(
      bookId: ID!             # Required — which book to fetch reviews for
      page: Int = 1           # Page number — defaults to 1
      limit: Int = 10         # Reviews per page — defaults to 10
      sortBy: String = "createdAt" # Sort field — "createdAt" | "rating" | "helpful"
    ): ReviewConnection!

    # Get top-rated reviews for a book (convenience query — returns up to 3)
    topReviews(bookId: ID!): [Review!]!
  }

  # Admin-only mutations — protected by context auth check
  type Mutation {
    # Toggle a book's featured status on/off
    toggleFeatured(id: ID!): Book

    # Soft delete a book — sets isActive to false
    deleteBook(id: ID!): Boolean

    #Create a new review (authenticated users who own the book only)
    createReview(
      bookId: ID!      # Which book to review
      rating: Int!     # 1–5 stars
      comment: String! # Review body — min 10 chars enforced in resolver
    ): Review!
  }
`;

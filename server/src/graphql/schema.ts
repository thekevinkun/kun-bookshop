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
  }

  # Admin-only mutations — protected by context auth check
  type Mutation {
    # Toggle a book's featured status on/off
    toggleFeatured(id: ID!): Book

    # Soft delete a book — sets isActive to false
    deleteBook(id: ID!): Boolean
  }
`;

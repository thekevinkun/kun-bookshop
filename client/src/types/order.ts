// Represents a single item sitting in the shopping cart
export interface ICartItem {
  bookId: string; // The book's MongoDB _id
  title: string; // Book title — shown in the cart drawer
  author: string; // Author name — shown in the cart drawer
  price: number; // The actual price (discountPrice if on sale, else price)
  coverImage: string; // Cover URL — shown as thumbnail in the cart
}

// Define the full shape of the cart store — state + actions
export interface CartState {
  items: ICartItem[]; // All items currently in the cart

  // Actions the UI can call
  addItem: (item: ICartItem) => void; // Add a book to the cart
  removeItem: (bookId: string) => void; // Remove a book by its ID
  clearCart: () => void; // Empty the cart (called after successful checkout)
  isInCart: (bookId: string) => boolean; // Check if a book is already in the cart

  // Computed helpers — derived from items array
  total: () => number; // Sum of all item prices
  itemCount: () => number; // How many books are in the cart
}

// Define the shape of a User object in our frontend
// This matches what the backend returns in the 'user' field of auth responses
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isVerified: boolean;
  avatar?: string;
  emailPreferences?: {
    marketing: boolean;
    orderUpdates: boolean;
    newReleases: boolean;
    priceDrops: boolean;
  };
}

// Define the shape of the entire auth store — state + actions
export interface AuthState {
  user: User | null; // null means not logged in
  token: string | null; // The access token — also stored in httpOnly cookie, but we keep it here for easy access
  isAuthenticated: boolean; // Convenience flag so components don't have to check user !== null

  // Actions — functions that update the store
  login: (user: User, token: string) => void; // Called after a successful login API response
  logout: () => void; // Called after the logout API response
  updateUser: (userData: Partial<User>) => void; // Called after profile update
  setToken: (token: string) => void; // Called after a successful token refresh
}

// Import bcryptjs for hashing and comparing passwords
// Never store plain-text passwords — always hash them first
import bcrypt from "bcryptjs";

// Hash a plain-text password before saving it to the database
// saltRounds: 12 means bcrypt runs 2^12 = 4096 hashing rounds — slow enough to resist brute force
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12; // Higher = slower to crack, but also slower to hash (12 is a good balance)
  return bcrypt.hash(password, saltRounds);
};

// Compare a plain-text password against a stored hash
// Returns true if they match, false if not
// bcrypt handles the salt internally — we don't need to extract it manually
export const comparePassword = async (
  plainPassword: string, // What the user typed at login
  hashedPassword: string, // What we have stored in the database
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

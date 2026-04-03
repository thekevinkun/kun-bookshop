import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with our account credentials from environment variables
// These are set in .env — never hardcoded here
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!, // Your Cloudinary account name
  api_key: process.env.CLOUDINARY_API_KEY!, // Your API key
  api_secret: process.env.CLOUDINARY_API_SECRET!, // Your API secret — keep this private
});

// Export the configured instance so controllers can use it directly
export default cloudinary;

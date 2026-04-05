import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLIENT_URL",
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const env = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
  CLIENT_URL: process.env.CLIENT_URL as string,
} as const;

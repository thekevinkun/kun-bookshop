// Import winston — this is our logging library, much more powerful than console.log
// It lets us save logs to files, format them as JSON, and filter by severity level
import winston from "winston";

// Install winston first if you haven't: npm install winston
// npm install --save-dev @types/winston (not needed — winston ships with its own types)

// List of field names that should NEVER appear in log output
// If any of these appear in a logged object, we replace the value with '[REDACTED]'
// This prevents passwords and tokens from accidentally ending up in log files
const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "refreshToken",
  "authorization",
  "stripe-signature",
  "secret",
  "apiKey",
  "resetPasswordToken",
  "verificationToken",
  "creditCard",
];

// Recursively walk through a log object and redact any sensitive fields
// 'Recursive' means it checks nested objects too, not just the top level
const redactSensitiveData = (obj: any): any => {
  // If this value is not an object (e.g. it's a string or number), return it as-is
  if (typeof obj !== "object" || obj === null) return obj;

  // Create a shallow copy so we don't mutate the original object
  const redacted = { ...obj };

  // Loop through every key in the object
  for (const key of Object.keys(redacted)) {
    // Check if this key name matches any of our sensitive field names (case-insensitive)
    if (
      SENSITIVE_FIELDS.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      // Replace the sensitive value with a safe placeholder string
      redacted[key] = "[REDACTED]";
    } else if (typeof redacted[key] === "object") {
      // If the value is itself an object, recursively check its keys too
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
};

// Create and configure the Winston logger instance
export const logger = winston.createLogger({
  // 'info' means we log info, warn, and error messages (but not debug in production)
  level: "info",

  format: winston.format.combine(
    // Add a timestamp to every log entry so we know exactly when something happened
    winston.format.timestamp(),

    // If an Error object is logged, include the full stack trace
    winston.format.errors({ stack: true }),

    // Apply our sensitive data redactor to every log entry before it's written
    winston.format((info) => {
      return redactSensitiveData(info);
    })(),

    // Output each log entry as a JSON string — easy to parse and search later
    winston.format.json(),
  ),

  transports: [
    // Write only error-level logs to a dedicated error file for quick diagnosis
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),

    // Write ALL log levels (info, warn, error) to a combined log file
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// In development, also print logs to the terminal in a simple readable format
// We skip this in production because we only want structured JSON logs there
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      // 'simple' format prints: level: message — easy to read while developing
      format: winston.format.simple(),
    }),
  );
}

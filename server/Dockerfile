# ---- Stage 1: Builder ----
# Use Node 22 on Alpine Linux (lightweight base image)
FROM node:22-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (Docker layer caching — only re-runs npm ci if these change)
COPY package*.json ./

# Install ALL dependencies including devDependencies (we need TypeScript compiler here)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript — outputs to /app/dist
RUN npm run build

# ---- Stage 2: Production ----
# Fresh image — nothing from builder except the compiled output
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (no TypeScript, no nodemon, etc.)
RUN npm ci --only=production

# Copy compiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Copy Handlebars email templates — these are not compiled, just copied as-is
COPY src/templates ./dist/templates

# Create upload directories (used if Cloudinary is ever bypassed locally)
RUN mkdir -p /app/uploads/books /app/uploads/covers

# Expose the port Express listens on
EXPOSE 5000

# Start the server directly with Node (no TypeScript runtime needed)
CMD ["node", "dist/server.js"]
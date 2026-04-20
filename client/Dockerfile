# ---- Stage 1: Builder ----
# Use Node 22 Alpine to build the React app
FROM node:22-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package files first (layer caching — only re-runs npm ci if these change)
COPY package*.json ./

# Install all dependencies needed to build
RUN npm ci

# Copy the rest of the source code
COPY . .

# Declare build arguments — these come from docker-compose args section
ARG VITE_API_URL
ARG VITE_SERVER_BASE_URL
ARG VITE_SITE_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY

# Make them available as environment variables so Vite picks them up during build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_BASE_URL=$VITE_SERVER_BASE_URL
ENV VITE_SITE_URL=$VITE_SITE_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

# Build the React app — outputs static files to /app/dist
RUN npm run build

# ---- Stage 2: Production ----
# Use nginx Alpine to serve the static files — tiny, fast, production-grade
FROM nginx:alpine

# Copy the built static files from the builder stage into nginx's serve directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config (SPA routing, gzip, cache headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (standard HTTP)
EXPOSE 80

# Start nginx in the foreground (daemon off keeps the container alive)
CMD ["nginx", "-g", "daemon off;"]
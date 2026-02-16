# ============================================================
# Mario: Infinite Kingdoms — Multi-stage Dockerfile
# Stage 1: Build the Vite frontend
# Stage 2: Production Node.js server (serves static + API proxy)
# Optimized: small final image, no devDependencies in production
# ============================================================

# --- Stage 1: Build ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first (leverages Docker layer caching)
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for Vite build)
RUN npm ci

# Copy source code
COPY . .

# Build the Vite production bundle
RUN npm run build


# --- Stage 2: Production ---
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install ONLY production dependencies (no Vite, no eslint, etc.)
RUN npm ci --omit=dev

# Copy the built static files from stage 1
COPY --from=builder /app/dist ./dist

# Copy the server source
COPY src/server ./src/server

# Cloud Run injects PORT env var (typically 8080)
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the production server
CMD ["node", "src/server/proxy.js"]

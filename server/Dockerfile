# Stage 1: Build TypeScript source
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to dist/
RUN npm run build

# Stage 2: Lean Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript from builder
COPY --from=builder /app/dist ./dist

# Create directories for persistent SQLite data and logs
RUN mkdir -p /app/data /app/logs && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]

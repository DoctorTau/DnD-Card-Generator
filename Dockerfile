## Multi-stage Dockerfile for building and serving the app
# This builds the app in the builder stage and copies the build + node_modules
# into a small runtime image which runs `npm run preview` (Vite preview server).

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (keeps dev deps because vite preview is in devDependencies)
COPY package.json package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy whole app from builder (ensures build artifacts and node_modules are present)
COPY --from=builder /app /app

EXPOSE 3000

# Use vite preview to serve the built app. Bind to 0.0.0.0 so it's reachable from outside.
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

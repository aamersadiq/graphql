FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/database/package.json ./packages/database/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/subgraphs/party/package.json ./packages/subgraphs/party/package.json
COPY packages/subgraphs/service/package.json ./packages/subgraphs/service/package.json
COPY packages/subgraphs/transaction/package.json ./packages/subgraphs/transaction/package.json
COPY packages/subgraphs/payment/package.json ./packages/subgraphs/payment/package.json
COPY packages/subgraphs/arrangement/package.json ./packages/subgraphs/arrangement/package.json

RUN pnpm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm --filter @ecommerce/api build

# Production image, copy all the files and run the server
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/config ./apps/api/config
COPY --from=builder /app/packages ./packages

# Set the working directory to the API directory
WORKDIR /app/apps/api

# Expose the port
EXPOSE 4000

# Run the server
CMD ["node", "dist/index.js"]
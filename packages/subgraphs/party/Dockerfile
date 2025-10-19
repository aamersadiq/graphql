FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .

COPY packages/subgraphs/party/package.json ./packages/subgraphs/party/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY packages/subgraphs/party ./packages/subgraphs/party
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

RUN pnpm --filter @e-commerce/subgraph-party build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/packages/subgraphs/party/dist ./dist
COPY --from=builder /app/packages/subgraphs/party/package.json .
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4001

CMD ["node", "dist/index.js"]
# Project Setup Guide

This guide provides step-by-step instructions for setting up the e-commerce platform project environment.

## Prerequisites

Ensure you have the following installed on your development machine:

- Node.js (v18.17.0 or later)
- pnpm (v8.6.0 or later)
- Docker and Docker Compose
- PostgreSQL (v15 or later)
- Git

## Initial Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd e-commerce-platform
```

### 2. Set Up Monorepo Structure

```bash
# Initialize pnpm workspace
pnpm init

# Create workspace configuration
cat > pnpm-workspace.yaml << EOF
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# Create directory structure
mkdir -p apps/web
mkdir -p apps/api
mkdir -p packages/database
mkdir -p packages/shared
mkdir -p packages/subgraphs/{party,service,transaction,payments,arrangement}
mkdir -p packages/config/{eslint,typescript,jest}
mkdir -p docker
```

### 3. Initialize Next.js Frontend

```bash
cd apps/web
pnpm dlx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ../..
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cat > .env << EOF
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ecommerce
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ecommerce

# API
API_PORT=4000
API_HOST=localhost

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URI=http://localhost:4000/graphql

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Apollo Router
APOLLO_ROUTER_PORT=4000
APOLLO_ROUTER_HOST=localhost

# Subgraphs
PARTY_SUBGRAPH_PORT=4001
SERVICE_SUBGRAPH_PORT=4002
TRANSACTION_SUBGRAPH_PORT=4003
PAYMENTS_SUBGRAPH_PORT=4004
ARRANGEMENT_SUBGRAPH_PORT=4005
EOF
```

### 5. Set Up Docker Compose

Create a `docker-compose.yml` file in the `docker` directory:

```bash
cat > docker/docker-compose.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: ecommerce-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: \${DATABASE_USER}
      POSTGRES_PASSWORD: \${DATABASE_PASSWORD}
      POSTGRES_DB: \${DATABASE_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  apollo-router:
    image: ghcr.io/apollographql/router:v1.25.0
    container_name: ecommerce-apollo-router
    ports:
      - "\${APOLLO_ROUTER_PORT}:4000"
    volumes:
      - ../apps/api/config:/dist/config
    command: ["--config", "/dist/config/router.yaml", "--supergraph", "/dist/config/supergraph.graphql"]
    depends_on:
      - party-subgraph
      - service-subgraph
      - transaction-subgraph
      - payments-subgraph
      - arrangement-subgraph
    environment:
      - APOLLO_ROUTER_SUPERGRAPH_PATH=/dist/config/supergraph.graphql

  party-subgraph:
    build:
      context: ../packages/subgraphs/party
      dockerfile: Dockerfile
    container_name: ecommerce-party-subgraph
    ports:
      - "\${PARTY_SUBGRAPH_PORT}:4001"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - PORT=4001
    depends_on:
      postgres:
        condition: service_healthy

  service-subgraph:
    build:
      context: ../packages/subgraphs/service
      dockerfile: Dockerfile
    container_name: ecommerce-service-subgraph
    ports:
      - "\${SERVICE_SUBGRAPH_PORT}:4002"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - PORT=4002
    depends_on:
      postgres:
        condition: service_healthy

  transaction-subgraph:
    build:
      context: ../packages/subgraphs/transaction
      dockerfile: Dockerfile
    container_name: ecommerce-transaction-subgraph
    ports:
      - "\${TRANSACTION_SUBGRAPH_PORT}:4003"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - PORT=4003
    depends_on:
      postgres:
        condition: service_healthy

  payments-subgraph:
    build:
      context: ../packages/subgraphs/payments
      dockerfile: Dockerfile
    container_name: ecommerce-payments-subgraph
    ports:
      - "\${PAYMENTS_SUBGRAPH_PORT}:4004"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - PORT=4004
    depends_on:
      postgres:
        condition: service_healthy

  arrangement-subgraph:
    build:
      context: ../packages/subgraphs/arrangement
      dockerfile: Dockerfile
    container_name: ecommerce-arrangement-subgraph
    ports:
      - "\${ARRANGEMENT_SUBGRAPH_PORT}:4005"
    environment:
      - DATABASE_URL=\${DATABASE_URL}
      - PORT=4005
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres-data:
EOF
```

### 6. Set Up Root Package.json

Create a `package.json` file in the root directory:

```bash
cat > package.json << EOF
{
  "name": "e-commerce-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @e-commerce/web dev",
    "build": "pnpm --recursive build",
    "start": "pnpm --filter @e-commerce/web start",
    "lint": "pnpm --recursive lint",
    "test": "pnpm --recursive test",
    "db:generate": "pnpm --filter @e-commerce/database generate",
    "db:migrate": "pnpm --filter @e-commerce/database migrate",
    "db:seed": "pnpm --filter @e-commerce/database seed",
    "docker:up": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker-compose -f docker/docker-compose.yml down",
    "subgraphs:dev": "pnpm --parallel --filter \"@e-commerce/subgraph-*\" dev",
    "router:dev": "pnpm --filter @e-commerce/api dev",
    "compose": "pnpm rover supergraph compose --config ./apps/api/config/supergraph.yaml > ./apps/api/config/supergraph.graphql"
  },
  "devDependencies": {
    "@types/node": "^20.5.0",
    "typescript": "^5.1.6"
  }
}
EOF
```

### 7. Set Up Database Package

Create a `package.json` file in the `packages/database` directory:

```bash
cat > packages/database/package.json << EOF
{
  "name": "@e-commerce/database",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "generate": "prisma generate",
    "migrate": "prisma migrate dev",
    "seed": "ts-node src/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.5.0",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.6"
  }
}
EOF
```

### 8. Set Up Prisma Schema

Create a `schema.prisma` file in the `packages/database/prisma` directory:

```bash
mkdir -p packages/database/prisma
cat > packages/database/prisma/schema.prisma << EOF
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Schema will be added based on the database-schema.md file
EOF
```

### 9. Set Up Shared Package

Create a `package.json` file in the `packages/shared` directory:

```bash
cat > packages/shared/package.json << EOF
{
  "name": "@e-commerce/shared",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/node": "^20.5.0",
    "typescript": "^5.1.6"
  }
}
EOF
```

### 10. Set Up Subgraph Template

Create a template for subgraph packages:

```bash
for subgraph in party service transaction payments arrangement; do
  cat > packages/subgraphs/$subgraph/package.json << EOF
{
  "name": "@e-commerce/subgraph-$subgraph",
  "version": "0.1.0",
  "private": true,
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts",
    "test": "jest"
  },
  "dependencies": {
    "@apollo/server": "^4.7.5",
    "@apollo/subgraph": "^2.5.3",
    "@e-commerce/database": "workspace:*",
    "@e-commerce/shared": "workspace:*",
    "graphql": "^16.7.1",
    "graphql-tag": "^2.12.6"
  },
  "devDependencies": {
    "@types/jest": "^29.5.3",
    "@types/node": "^20.5.0",
    "jest": "^29.6.2",
    "ts-jest": "^29.1.1",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.1.6"
  }
}
EOF

  mkdir -p packages/subgraphs/$subgraph/src
  cat > packages/subgraphs/$subgraph/src/index.ts << EOF
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';

// Schema will be added based on the graphql-federation-spec.md file
const typeDefs = gql\`
  # Schema will be added here
\`;

const resolvers = {
  Query: {
    // Resolvers will be added here
  },
  Mutation: {
    // Resolvers will be added here
  }
};

async function startServer() {
  const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT || '4000') }
  });

  console.log(\`🚀 $subgraph subgraph ready at \${url}\`);
}

startServer();
EOF

  cat > packages/subgraphs/$subgraph/tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
EOF

  cat > packages/subgraphs/$subgraph/Dockerfile << EOF
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .

COPY packages/subgraphs/$subgraph/package.json ./packages/subgraphs/$subgraph/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY packages/subgraphs/$subgraph ./packages/subgraphs/$subgraph
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

RUN pnpm --filter @e-commerce/subgraph-$subgraph build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/packages/subgraphs/$subgraph/dist ./dist
COPY --from=builder /app/packages/subgraphs/$subgraph/package.json .
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/index.js"]
EOF
done
```

### 11. Set Up API Gateway

Create a configuration directory for the Apollo Router:

```bash
mkdir -p apps/api/config
cat > apps/api/config/router.yaml << EOF
federation:
  version: 2
supergraph:
  listen: 0.0.0.0:4000
  introspection: true
cors:
  origins:
    - http://localhost:3000
    - https://studio.apollographql.com
headers:
  all:
    request:
      - propagate:
          named: "authorization"
EOF

cat > apps/api/config/supergraph.yaml << EOF
federation_version: 2
subgraphs:
  party:
    routing_url: http://party-subgraph:4001/graphql
    schema:
      file: ../../packages/subgraphs/party/schema.graphql
  service:
    routing_url: http://service-subgraph:4002/graphql
    schema:
      file: ../../packages/subgraphs/service/schema.graphql
  transaction:
    routing_url: http://transaction-subgraph:4003/graphql
    schema:
      file: ../../packages/subgraphs/transaction/schema.graphql
  payments:
    routing_url: http://payments-subgraph:4004/graphql
    schema:
      file: ../../packages/subgraphs/payments/schema.graphql
  arrangement:
    routing_url: http://arrangement-subgraph:4005/graphql
    schema:
      file: ../../packages/subgraphs/arrangement/schema.graphql
EOF
```

### 12. Install Dependencies

```bash
# Install root dependencies
pnpm install

# Install Next.js dependencies
cd apps/web
pnpm add @apollo/client @apollo/experimental-nextjs-app-support graphql
pnpm add -D @types/react @types/react-dom eslint-plugin-react-hooks
cd ../..

# Install database dependencies
cd packages/database
pnpm install
cd ../..
```

### 13. Set Up Database

```bash
# Start PostgreSQL
pnpm docker:up postgres

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed
```

### 14. Start Development Environment

```bash
# Start all services
pnpm docker:up

# Start Next.js development server
pnpm dev
```

## Development Workflow

### Running the Application

1. Start the database and services:
   ```bash
   pnpm docker:up
   ```

2. Start the Next.js development server:
   ```bash
   pnpm dev
   ```

3. Access the application at http://localhost:3000

### Updating GraphQL Schema

1. Update the schema in the respective subgraph
2. Regenerate the supergraph:
   ```bash
   pnpm compose
   ```

### Database Migrations

1. Make changes to the Prisma schema
2. Create a migration:
   ```bash
   pnpm db:migrate
   ```

### Testing

Run tests for all packages:
```bash
pnpm test
```

## Deployment

### Building for Production

```bash
# Build all packages
pnpm build
```

### Docker Deployment

```bash
# Build and push Docker images
docker-compose -f docker/docker-compose.prod.yml build
docker-compose -f docker/docker-compose.prod.yml push
```

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Verify connection details in `.env` file

3. Try connecting manually:
   ```bash
   psql postgresql://postgres:postgres@localhost:5432/ecommerce
   ```

### GraphQL Federation Issues

If subgraphs are not properly federated:

1. Check if all subgraphs are running:
   ```bash
   docker ps | grep subgraph
   ```

2. Verify the supergraph composition:
   ```bash
   pnpm compose
   ```

3. Check Apollo Router logs:
   ```bash
   docker logs ecommerce-apollo-router
   ```

## Conclusion

You now have a fully configured development environment for the e-commerce platform. The project follows a monorepo structure with clear separation of concerns between the frontend, API, and database layers.
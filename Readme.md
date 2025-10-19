# E-Commerce Platform with GraphQL Federation

A modern e-commerce platform built with Next.js, React, GraphQL Federation, and PostgreSQL, following the architecture shown in the provided diagram.

## Architecture Overview

This project implements a modern web application architecture with:

- **GraphQL Federation**: Using Apollo Router to combine multiple subgraphs
- **Next.js App Router**: For server and client components with TypeScript
- **PostgreSQL Database**: With Prisma ORM and repository pattern
- **React Components**: Following atomic design principles
- **Stripe Integration**: For secure payment processing

![Architecture Diagram](docs/architecture-diagram.png)

## Key Features

- **Domain-Driven Design**: Clear separation of concerns with domain-specific subgraphs
- **GraphQL Federation**: Modular API with specialized subgraphs (Party, Service, Transaction, Payment, Arrangement)
- **Static & Dynamic Rendering**: Optimized performance with static product pages and dynamic user content
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Authentication**: Secure JWT-based authentication
- **Payment Processing**: Integrated with Stripe for secure payments
- **Form Validation**: Using React Hook Form with Zod schema validation
- **Cart Management**: Persistent shopping cart with local storage sync

## Project Structure

```
├── apps/
│   ├── api/                  # Apollo Router configuration
│   │   ├── config/           # Supergraph and router configuration
│   │   └── package.json      # API dependencies
│   │
│   └── web/                  # Next.js frontend application
│       ├── src/
│       │   ├── app/          # Next.js App Router pages
│       │   ├── components/   # React components (atomic design)
│       │   ├── hooks/        # Custom React hooks
│       │   ├── lib/          # Utility libraries
│       │   └── utils/        # Helper functions
│       ├── public/           # Static assets
│       └── package.json      # Frontend dependencies
│
├── packages/
│   ├── database/             # Database layer with Prisma
│   │   ├── prisma/           # Prisma schema and migrations
│   │   └── src/              # Repository implementations
│   │
│   ├── shared/               # Shared utilities and types
│   │
│   └── subgraphs/            # GraphQL subgraphs
│       ├── party/            # User management and authentication
│       ├── service/          # Products and categories
│       ├── transaction/      # Orders and cart functionality
│       ├── payment/          # Payment processing with Stripe
│       └── arrangement/      # Promotions and discounts
│
├── package.json              # Root package.json for workspaces
└── pnpm-workspace.yaml       # PNPM workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- PNPM 8+
- PostgreSQL 14+
- Docker (optional, for containerized setup)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp packages/database/.env.example packages/database/.env
   ```

4. Set up the database:
   ```bash
   pnpm db:setup
   ```

5. Start the development servers:
   ```bash
   pnpm dev
   ```

### Running with Docker

```bash
docker-compose up -d
```

## Development

### Running Subgraphs Individually

```bash
pnpm --filter @ecommerce/subgraph-party dev
pnpm --filter @ecommerce/subgraph-service dev
# etc.
```

### Running the Apollo Router

```bash
pnpm --filter @ecommerce/api dev
```

### Running the Frontend

```bash
pnpm --filter @ecommerce/web dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run specific tests
pnpm --filter @ecommerce/web test
pnpm --filter @ecommerce/subgraph-party test
```

## Deployment

The application can be deployed using the provided GitHub Actions workflows or manually:

```bash
# Build all packages
pnpm build

# Deploy API
pnpm --filter @ecommerce/api deploy

# Deploy web
pnpm --filter @ecommerce/web deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
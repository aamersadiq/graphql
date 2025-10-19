# Backend Architecture: GraphQL Federation with Apollo Router

This document provides a detailed overview of the backend architecture for our e-commerce platform, focusing on the GraphQL Federation implementation with Apollo Router.

## Overview

Our backend architecture follows a federated GraphQL approach, where multiple independent services (subgraphs) are combined into a unified API (supergraph) through Apollo Router. This architecture enables:

- **Domain-driven development**: Each subgraph focuses on a specific business domain
- **Team autonomy**: Different teams can develop and deploy subgraphs independently
- **Scalability**: Services can be scaled independently based on demand
- **Flexibility**: New domains can be added without disrupting existing functionality

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                      Apollo Router                             │
│                     (Graph Gateway)                            │
└───┬─────────────┬────────────────┬────────────────┬────────────┘
    │             │                │                │
    │             │                │                │
┌───▼────┐   ┌────▼───┐      ┌────▼────┐      ┌────▼─────┐   ┌────────────┐
│ Party  │   │ Service│      │Transaction│     │ Payments │   │Arrangement │
│Subgraph│   │Subgraph│      │ Subgraph │     │ Subgraph │   │  Subgraph  │
└───┬────┘   └────┬───┘      └────┬────┘      └────┬─────┘   └─────┬──────┘
    │             │                │                │               │
    │             │                │                │               │
┌───▼─────────────▼────────────────▼────────────────▼───────────────▼──────┐
│                          PostgreSQL Database                             │
│                                                                          │
│     ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│     │  Users   │  │ Products │  │  Orders  │  │ Payments │  │Promotions│ │
│     │  Tables  │  │  Tables  │  │  Tables  │  │  Tables  │  │  Tables  │ │
│     └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Apollo Router

The Apollo Router serves as the gateway for all GraphQL requests. It:

- Routes queries to the appropriate subgraphs
- Composes responses from multiple subgraphs
- Handles authentication and authorization
- Provides performance monitoring and caching
- Implements query planning for efficient execution

**Configuration:**

```yaml
# apps/api/config/router.yaml
supergraph:
  path: ./config/supergraph.yaml
  
cors:
  origins:
    - http://localhost:3000
    - https://studio.apollographql.com
  
authentication:
  jwt:
    header: Authorization
    secret: ${JWT_SECRET}

plugins:
  - name: apollo.telemetry
  - name: apollo.cache
```

### 2. Subgraphs

Each subgraph is an independent GraphQL service that focuses on a specific domain:

#### Party Subgraph

Handles user-related functionality:
- User registration and authentication
- User profiles and preferences
- Role-based access control

**Key Schema Types:**
```graphql
type User @key(fields: "id") {
  id: ID!
  email: String!
  firstName: String
  lastName: String
  role: UserRole!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum UserRole {
  CUSTOMER
  ADMIN
  SUPPORT
}

type Query {
  me: User
  user(id: ID!): User
  users: [User!]!
}

type Mutation {
  register(input: RegisterInput!): AuthPayload!
  login(input: LoginInput!): AuthPayload!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

#### Service Subgraph

Manages product-related functionality:
- Product catalog and categories
- Product search and filtering
- Inventory management

**Key Schema Types:**
```graphql
type Product @key(fields: "id") {
  id: ID!
  name: String!
  description: String
  price: Float!
  images: [String!]
  category: Category!
  inventory: Inventory!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Category {
  id: ID!
  name: String!
  description: String
  products: [Product!]!
}

type Inventory {
  id: ID!
  quantity: Int!
  product: Product!
}

type Query {
  product(id: ID!): Product
  products(filter: ProductFilterInput): [Product!]!
  categories: [Category!]!
}

type Mutation {
  createProduct(input: CreateProductInput!): Product!
  updateProduct(id: ID!, input: UpdateProductInput!): Product!
  deleteProduct(id: ID!): Boolean!
}
```

#### Transaction Subgraph

Handles order processing:
- Shopping cart management
- Order creation and tracking
- Order history

**Key Schema Types:**
```graphql
type Order @key(fields: "id") {
  id: ID!
  user: User!
  items: [OrderItem!]!
  status: OrderStatus!
  total: Float!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  price: Float!
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}

type Cart @key(fields: "id") {
  id: ID!
  user: User!
  items: [CartItem!]!
  total: Float!
}

type CartItem {
  id: ID!
  product: Product!
  quantity: Int!
}

type Query {
  order(id: ID!): Order
  orders(userId: ID!): [Order!]!
  cart(userId: ID!): Cart
}

type Mutation {
  createOrder(input: CreateOrderInput!): Order!
  updateOrderStatus(id: ID!, status: OrderStatus!): Order!
  addToCart(input: AddToCartInput!): Cart!
  removeFromCart(cartId: ID!, itemId: ID!): Cart!
  clearCart(cartId: ID!): Boolean!
}
```

#### Payments Subgraph

Manages payment processing:
- Payment method management
- Transaction processing
- Refund handling

**Key Schema Types:**
```graphql
type Payment @key(fields: "id") {
  id: ID!
  order: Order!
  amount: Float!
  status: PaymentStatus!
  method: PaymentMethod!
  transactionId: String
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  PAYPAL
  BANK_TRANSFER
}

type Query {
  payment(id: ID!): Payment
  paymentsByOrder(orderId: ID!): [Payment!]!
}

type Mutation {
  createPayment(input: CreatePaymentInput!): Payment!
  processPayment(id: ID!): Payment!
  refundPayment(id: ID!, amount: Float!): Payment!
}
```

#### Arrangement Subgraph

Handles promotions and discounts:
- Coupon code management
- Discount rules
- Promotional campaigns

**Key Schema Types:**
```graphql
type Promotion @key(fields: "id") {
  id: ID!
  code: String!
  description: String
  discountType: DiscountType!
  discountValue: Float!
  minimumPurchase: Float
  startDate: DateTime!
  endDate: DateTime
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum DiscountType {
  PERCENTAGE
  FIXED_AMOUNT
}

type Query {
  promotion(id: ID!): Promotion
  promotionByCode(code: String!): Promotion
  activePromotions: [Promotion!]!
}

type Mutation {
  createPromotion(input: CreatePromotionInput!): Promotion!
  updatePromotion(id: ID!, input: UpdatePromotionInput!): Promotion!
  deactivatePromotion(id: ID!): Promotion!
}
```

### 3. Data Access Layer

Each subgraph implements the repository pattern for data access:

```typescript
// Example repository implementation for the Product entity
export class ProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  async findAll(filter?: ProductFilterInput): Promise<Product[]> {
    const where = this.buildWhereClause(filter);
    
    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  async create(data: CreateProductInput): Promise<Product> {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        images: data.images,
        category: {
          connect: { id: data.categoryId },
        },
        inventory: {
          create: {
            quantity: data.quantity || 0,
          },
        },
      },
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  // Additional methods...
}
```

## Federation Implementation

### Supergraph Composition

The supergraph is composed using the Apollo Federation specification:

```yaml
# apps/api/config/supergraph.yaml
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
```

### Entity Resolution

Federation requires entity resolution to connect entities across subgraphs:

```typescript
// Example of entity resolution in the Party subgraph
const resolvers = {
  User: {
    __resolveReference: async (reference: { id: string }, { dataSources }) => {
      return dataSources.userRepository.findById(reference.id);
    },
  },
};
```

## Authentication and Authorization

Authentication is implemented using JWT:

1. The Party subgraph handles authentication and issues JWTs
2. The Apollo Router validates JWTs and adds user information to the GraphQL context
3. Each subgraph implements authorization checks based on the user context

```typescript
// Example of authorization middleware in a subgraph
const authMiddleware = async (
  resolve: any,
  root: any,
  args: any,
  context: any,
  info: any
) => {
  const { user } = context;
  
  if (!user) {
    throw new AuthenticationError('You must be logged in');
  }
  
  // Role-based authorization
  if (info.fieldName === 'createProduct' && user.role !== 'ADMIN') {
    throw new ForbiddenError('Not authorized');
  }
  
  return resolve(root, args, context, info);
};
```

## Error Handling

Each subgraph implements consistent error handling:

```typescript
// Example of error handling in a resolver
try {
  const product = await dataSources.productRepository.findById(id);
  
  if (!product) {
    throw new NotFoundError(`Product with ID ${id} not found`);
  }
  
  return product;
} catch (error) {
  if (error instanceof NotFoundError) {
    throw error;
  }
  
  logger.error('Failed to fetch product', { error, id });
  throw new ApolloError('Failed to fetch product', 'INTERNAL_SERVER_ERROR');
}
```

## Deployment

The backend is deployed using Docker containers:

```yaml
# docker-compose.yml (excerpt)
services:
  apollo-router:
    image: ghcr.io/apollographql/router:v1.25.0
    ports:
      - "4000:4000"
    volumes:
      - ./apps/api/config:/config
    environment:
      - APOLLO_ROUTER_CONFIG=/config/router.yaml
      - APOLLO_ROUTER_SUPERGRAPH_PATH=/config/supergraph.yaml
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - party-subgraph
      - service-subgraph
      - transaction-subgraph
      - payments-subgraph
      - arrangement-subgraph

  party-subgraph:
    build:
      context: .
      dockerfile: ./packages/subgraphs/party/Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres

  # Other subgraph services...

  postgres:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

## Conclusion

The federated GraphQL architecture provides a scalable, maintainable approach to building our e-commerce platform's backend. By separating concerns into domain-specific subgraphs, we achieve:

1. **Modularity**: Each subgraph focuses on a specific domain
2. **Scalability**: Services can be scaled independently
3. **Team autonomy**: Different teams can work on different subgraphs
4. **Flexibility**: New features can be added without disrupting existing functionality

This architecture supports our business requirements while providing a solid foundation for future growth.
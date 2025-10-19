# Frontend Architecture Specification

## Overview

This document outlines the frontend architecture for our e-commerce platform built with Next.js App Router, React, and TypeScript. The architecture follows modern best practices for building scalable and maintainable web applications.

## Architecture Principles

1. **Component-Based Architecture**: Organize UI into reusable, composable components
2. **Atomic Design Methodology**: Structure components following atomic design principles
3. **Separation of Concerns**: Separate business logic from UI components
4. **Type Safety**: Use TypeScript for type checking and better developer experience
5. **Server Components**: Leverage Next.js server components for improved performance
6. **Progressive Enhancement**: Ensure functionality works without JavaScript when possible
7. **Responsive Design**: Mobile-first approach for all UI components
8. **Accessibility**: Follow WCAG guidelines for accessible UI

## Next.js App Router Structure

```
/apps/web/
├── app/
│   ├── (auth)/                    # Authentication routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (shop)/                    # Main shopping routes
│   │   ├── products/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Product detail page
│   │   │   └── page.tsx           # Products listing page
│   │   │
│   │   ├── categories/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Category detail page
│   │   │   └── page.tsx           # Categories listing page
│   │   │
│   │   ├── search/
│   │   │   └── page.tsx           # Search results page
│   │   │
│   │   └── layout.tsx             # Shop layout with navigation
│   │
│   ├── (checkout)/                # Checkout flow
│   │   ├── cart/
│   │   │   └── page.tsx           # Shopping cart page
│   │   ├── checkout/
│   │   │   └── page.tsx           # Checkout page
│   │   ├── payment/
│   │   │   └── page.tsx           # Payment page
│   │   ├── confirmation/
│   │   │   └── page.tsx           # Order confirmation page
│   │   └── layout.tsx             # Checkout layout
│   │
│   ├── (account)/                 # User account routes
│   │   ├── profile/
│   │   │   └── page.tsx           # User profile page
│   │   ├── orders/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx       # Order detail page
│   │   │   └── page.tsx           # Orders listing page
│   │   ├── addresses/
│   │   │   └── page.tsx           # Address management page
│   │   ├── payment-methods/
│   │   │   └── page.tsx           # Payment methods page
│   │   └── layout.tsx             # Account layout with sidebar
│   │
│   ├── api/                       # API routes
│   │   └── graphql/
│   │       └── route.ts           # GraphQL API route
│   │
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Homepage
│   ├── error.tsx                  # Error boundary
│   ├── loading.tsx                # Loading state
│   └── not-found.tsx              # 404 page
│
├── components/                    # React components
│   ├── atoms/                     # Atomic design - atoms
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Typography/
│   │   └── ...
│   │
│   ├── molecules/                 # Atomic design - molecules
│   │   ├── ProductCard/
│   │   ├── SearchBar/
│   │   ├── FormField/
│   │   └── ...
│   │
│   ├── organisms/                 # Atomic design - organisms
│   │   ├── ProductGrid/
│   │   ├── NavigationMenu/
│   │   ├── CheckoutForm/
│   │   └── ...
│   │
│   ├── templates/                 # Atomic design - templates
│   │   ├── ProductListTemplate/
│   │   ├── ProductDetailTemplate/
│   │   ├── CheckoutTemplate/
│   │   └── ...
│   │
│   └── ui/                        # Shadcn UI components
│       ├── button.tsx
│       ├── input.tsx
│       └── ...
│
├── hooks/                         # Custom React hooks
│   ├── useCart.ts
│   ├── useAuth.ts
│   ├── useProducts.ts
│   └── ...
│
├── lib/                           # Utility functions and libraries
│   ├── apollo/                    # Apollo Client setup
│   │   ├── client.ts
│   │   └── index.ts
│   │
│   ├── utils/                     # Utility functions
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   │
│   └── constants.ts               # Application constants
│
├── types/                         # TypeScript type definitions
│   ├── product.ts
│   ├── user.ts
│   ├── order.ts
│   └── ...
│
├── styles/                        # Global styles
│   ├── globals.css
│   └── theme.ts
│
└── public/                        # Static assets
    ├── images/
    ├── fonts/
    └── ...
```

## Component Architecture

### Atomic Design Implementation

We'll follow the atomic design methodology to organize our components:

1. **Atoms**: Basic building blocks (Button, Input, Typography)
2. **Molecules**: Simple combinations of atoms (ProductCard, FormField)
3. **Organisms**: Complex UI sections (ProductGrid, NavigationMenu)
4. **Templates**: Page layouts without specific content
5. **Pages**: Templates with actual content (implemented as Next.js pages)

### Component Structure

Each component will follow this structure:

```
/components/[type]/[ComponentName]/
├── index.ts                # Export the component
├── [ComponentName].tsx     # Component implementation
├── [ComponentName].module.css  # Component styles (if not using Tailwind)
└── [ComponentName].test.tsx    # Component tests
```

### Component Example

```tsx
// Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'button' : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

## Server Components vs. Client Components

Next.js App Router introduces a distinction between Server Components and Client Components. We'll use them as follows:

### Server Components (Default)

- Product listings
- Category pages
- Static content
- SEO-critical pages
- Data fetching components

### Client Components

- Interactive UI elements
- Components using React hooks
- Components using browser APIs
- Components with event handlers

Example of a Client Component:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/atoms/Button';

interface AddToCartButtonProps {
  productId: string;
  initialQuantity?: number;
}

export function AddToCartButton({ productId, initialQuantity = 1 }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      // Add to cart logic
    } catch (error) {
      console.error('Failed to add to cart', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex border rounded">
        <button
          className="px-2 py-1"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
        >
          -
        </button>
        <span className="px-4 py-1">{quantity}</span>
        <button
          className="px-2 py-1"
          onClick={() => setQuantity(quantity + 1)}
        >
          +
        </button>
      </div>
      <Button onClick={handleAddToCart} disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add to Cart'}
      </Button>
    </div>
  );
}
```

## Data Fetching Strategy

### GraphQL Data Fetching

We'll use Apollo Client for GraphQL data fetching:

```tsx
// lib/apollo/client.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { registerApolloClient } from '@apollo/experimental-nextjs-app-support/rsc';

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URI,
      // Use explicit `window.fetch` to avoid issues with `globalThis.fetch` in SSR
      fetch: (...args) => {
        return fetch(...args);
      },
    }),
  });
});
```

### Server Component Data Fetching

```tsx
// app/products/[id]/page.tsx
import { getClient } from '@/lib/apollo/client';
import { gql } from '@apollo/client';
import { ProductDetail } from '@/components/organisms/ProductDetail';
import { notFound } from 'next/navigation';

const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    product(id: $id) {
      id
      name
      description
      price {
        amount
        currency
      }
      images {
        id
        url
        altText
      }
      category {
        id
        name
      }
    }
  }
`;

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data } = await getClient().query({
    query: GET_PRODUCT,
    variables: { id: params.id },
  });

  if (!data.product) {
    notFound();
  }

  return <ProductDetail product={data.product} />;
}
```

### Client Component Data Fetching

```tsx
'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@apollo/experimental-nextjs-app-support/ssr';
import { gql } from '@apollo/client';

const GET_PRODUCTS = gql`
  query GetProducts($categoryId: ID, $search: String, $page: Int!, $pageSize: Int!) {
    products(categoryId: $categoryId, search: $search, pagination: { page: $page, pageSize: $pageSize }) {
      edges {
        node {
          id
          name
          price {
            amount
            currency
          }
          images {
            id
            url
            altText
            isPrimary
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      totalCount
    }
  }
`;

export function ProductList({ categoryId, initialSearch = '' }) {
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const { data } = useSuspenseQuery(GET_PRODUCTS, {
    variables: { categoryId, search, page, pageSize },
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.products.edges.map(({ node }) => (
          <ProductCard key={node.id} product={node} />
        ))}
      </div>
      
      <div className="mt-4 flex justify-between">
        <button
          disabled={!data.products.pageInfo.hasPreviousPage}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>
          Page {page} of {Math.ceil(data.products.totalCount / pageSize)}
        </span>
        <button
          disabled={!data.products.pageInfo.hasNextPage}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## State Management

### Local Component State

For simple component state, we'll use React's `useState` and `useReducer` hooks.

### Global State Management

For global state, we'll use a combination of:

1. **Apollo Client Cache**: For server data
2. **React Context**: For shared state like authentication and shopping cart
3. **Local Storage**: For persisting cart items and user preferences

Example of a Context for Cart Management:

```tsx
// hooks/useCart.tsx
'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CartState = {
  items: CartItem[];
  total: number;
};

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
        
        return {
          ...state,
          items: newItems,
          total: calculateTotal(newItems),
        };
      }

      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((item) => item.id !== action.payload.id);
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map((item) =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return {
        ...state,
        items: newItems,
        total: calculateTotal(newItems),
      };
    }
    case 'CLEAR_CART':
      return {
        items: [],
        total: 0,
      };
    default:
      return state;
  }
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart) as CartState;
      parsedCart.items.forEach((item) => {
        dispatch({ type: 'ADD_ITEM', payload: item });
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addItem = (item: Omit<CartItem, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({ type: 'ADD_ITEM', payload: { ...item, id } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{ state, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
```

## Authentication Strategy

We'll implement authentication using JWT tokens:

```tsx
// hooks/useAuth.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $firstName: String!, $lastName: String!) {
    register(input: { email: $email, password: $password, firstName: $firstName, lastName: $lastName }) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });

      const { token, user } = data.login;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data } = await registerMutation({
        variables: { email, password, firstName, lastName },
      });

      const { token, user } = data.register;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (err) {
      setError('Registration failed');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Rendering Strategies

### Static Rendering

For content that doesn't change frequently:

- Homepage
- Product category pages
- Static content pages

```tsx
// app/categories/[id]/page.tsx
export const generateStaticParams = async () => {
  const { data } = await getClient().query({
    query: gql`
      query GetCategories {
        categories {
          id
        }
      }
    `,
  });

  return data.categories.map((category) => ({
    id: category.id,
  }));
};

export const revalidate = 3600; // Revalidate every hour
```

### Dynamic Rendering

For user-specific content:

- Shopping cart
- User profile
- Order history

```tsx
// app/cart/page.tsx
export const dynamic = 'force-dynamic';
```

### Incremental Static Regeneration (ISR)

For content that changes occasionally:

- Product detail pages
- Blog posts

```tsx
// app/products/[id]/page.tsx
export const revalidate = 3600; // Revalidate every hour
```

## Styling Strategy

We'll use Tailwind CSS for styling, with a consistent design system:

```tsx
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

## Testing Strategy

### Unit Testing

For testing individual components and hooks:

```tsx
// components/atoms/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    await userEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});
```

### Integration Testing

For testing page functionality:

```tsx
// app/(shop)/products/[id]/page.test.tsx
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import ProductPage from './page';
import { GET_PRODUCT } from './queries';

const mocks = [
  {
    request: {
      query: GET_PRODUCT,
      variables: { id: '1' },
    },
    result: {
      data: {
        product: {
          id: '1',
          name: 'Test Product',
          description: 'Test description',
          price: { amount: 99.99, currency: 'USD' },
          images: [{ id: '1', url: '/test.jpg', altText: 'Test' }],
          category: { id: '1', name: 'Test Category' },
        },
      },
    },
  },
];

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

describe('ProductPage', () => {
  it('renders product details', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ProductPage params={{ id: '1' }} />
      </MockedProvider>
    );

    expect(await screen.findByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
    expect(screen.getByAltText('Test')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

For testing critical user flows:

```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Add product to cart
  await page.goto('/products/1');
  await page.click('button:has-text("Add to Cart")');
  
  // Go to cart
  await page.click('a:has
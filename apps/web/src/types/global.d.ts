// Global type declarations

// Declare process.env for TypeScript
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    NEXT_PUBLIC_GRAPHQL_URL: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    DATABASE_URL: string;
  }
}

// Declare modules that don't have type definitions
declare module '@apollo/client' {
  import { ReactNode } from 'react';

  export interface ApolloClientOptions<TCacheShape> {
    link: any;
    cache: any;
    defaultOptions?: any;
    name?: string;
    version?: string;
    queryDeduplication?: boolean;
    ssrMode?: boolean;
    ssrForceFetchDelay?: number;
    connectToDevTools?: boolean;
    typeDefs?: any;
    resolvers?: any;
  }

  export class ApolloClient<TCacheShape> {
    constructor(options: ApolloClientOptions<TCacheShape>);
    mutate<T = any, TVariables = any>(options: any): Promise<any>;
    query<T = any, TVariables = any>(options: any): Promise<any>;
    watchQuery<T = any, TVariables = any>(options: any): any;
    readQuery<T = any, TVariables = any>(options: any): T | null;
    readFragment<T = any, TVariables = any>(options: any): T | null;
    writeQuery<T = any, TVariables = any>(options: any): void;
    writeFragment<T = any, TVariables = any>(options: any): void;
    resetStore(): Promise<any>;
    clearStore(): Promise<any>;
    stop(): void;
    reFetchObservableQueries(): Promise<any>;
  }

  export interface ApolloProviderProps {
    client: ApolloClient<any>;
    children: ReactNode;
  }

  export function ApolloProvider(props: ApolloProviderProps): JSX.Element;

  export class InMemoryCache {
    constructor(options?: any);
  }

  export class HttpLink {
    constructor(options: any);
  }

  export function from(links: any[]): any;
  export function gql(template: any, ...expressions: any[]): any;
  export function useQuery<T = any, TVariables = any>(query: any, options?: any): any;
  export function useMutation<T = any, TVariables = any>(mutation: any, options?: any): [
    (options?: any) => Promise<any>,
    any
  ];
}

declare module '@apollo/client/link/error' {
  export function onError(options: any): any;
}

declare module '@apollo/client/link/context' {
  export function setContext(
    setter: (
      operation: any,
      prevContext: { headers?: Record<string, string> }
    ) => any
  ): any;
}

declare module 'next-auth/react' {
  import { ReactNode } from 'react';
  
  export interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: string;
    };
    accessToken?: string;
    expires: string;
  }
  
  export interface SessionProviderProps {
    children: ReactNode;
    session?: Session;
  }
  
  export function SessionProvider(props: SessionProviderProps): JSX.Element;
  
  export function useSession(): {
    data: Session | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    update: (data: any) => Promise<Session>;
  };
  
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
}

declare module '@apollo/experimental-nextjs-app-support/rsc' {
  import { ApolloClient, NormalizedCacheObject } from '@apollo/client';
  
  export function registerApolloClient<CacheShape = NormalizedCacheObject>(
    createClient: () => ApolloClient<CacheShape>
  ): {
    getClient: () => ApolloClient<CacheShape>;
  };
}

// Stripe types
declare module '@stripe/stripe-js' {
  export interface Stripe {
    confirmCardPayment: (clientSecret: string, data: any) => Promise<any>;
    createPaymentMethod: (options: any) => Promise<any>;
    // Add other methods as needed
  }
  
  export function loadStripe(publishableKey: string): Promise<Stripe | null>;
}

declare module '@stripe/react-stripe-js' {
  import { ReactNode } from 'react';
  import { Stripe } from '@stripe/stripe-js';
  
  export interface ElementsProps {
    stripe: Promise<Stripe | null>;
    children?: ReactNode;
  }
  
  export function Elements(props: ElementsProps): JSX.Element;
  export function useStripe(): Stripe | null;
  export function useElements(): any;
  export const CardElement: React.FC<any>;
}

// Add JSX namespace for React components
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
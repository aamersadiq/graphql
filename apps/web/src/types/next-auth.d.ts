import 'next-auth';
import 'next-auth/react';

declare module 'next-auth' {
  interface Session {
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
}

declare module 'next-auth/react' {
  interface SessionProviderProps {
    children?: React.ReactNode;
    session?: any;
  }
}
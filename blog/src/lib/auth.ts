// src/lib/auth.ts
import { Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * Augment the next-auth module's types
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isSuperUser: boolean;
      provider?: string;
    };
  }
  
  interface User {
    id?: string;
    isSuperUser?: boolean;
    provider?: string;
    _id?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    isSuperUser?: boolean;
    provider?: string;
    picture?: string;
  }
}

/**
 * Helper function to get the absolute URL for NextAuth
 */
export function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Browser should use the current URL
    return window.location.origin;
  }
  
  // Server should use the environment variable or fallback
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Default fallback for local development
  return 'http://localhost:3000';
}

// src/lib/auth.ts
import { JWT } from "next-auth/jwt";

/**
 * Augment the next-auth module's types
 */
declare module "next-auth" {
  // Make sure User interface is compatible
  interface User {
    id: string;
    isSuperUser?: boolean;
    name?: string;
    email?: string;
    image?: string;
  }
}

// Augment the JWT type as well
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
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

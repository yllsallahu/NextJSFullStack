import "next-auth";
import { ObjectId } from "mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      isSuperUser?: boolean;
      image?: string | null;
      provider?: string; // Added provider information
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    password?: string;
    isSuperUser?: boolean;
    image?: string | null;
    provider?: string; // Added provider information
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null;
    email?: string | null;
    isSuperUser?: boolean;
    image?: string | null;
    provider?: string; // Added provider information
  }
}
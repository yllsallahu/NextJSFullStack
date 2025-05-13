import "next-auth";
import { ObjectId } from "mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    password?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string | null;
    name?: string | null;
  }
}
import "next-auth";
import { ObjectId } from "mongodb";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      isSuperUser?: boolean;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    password?: string;
    isSuperUser?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name?: string | null; // Added name as it's often included
    email?: string | null;
    isSuperUser?: boolean; // Ensure this line is present
  }
}
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    isSuperUser?: boolean;
    image?: string | null;
    provider?: string;
    favorites?: string[]; // Add favorites property
  }

  interface Session {
    user?: User & DefaultSession["user"];
  }
}

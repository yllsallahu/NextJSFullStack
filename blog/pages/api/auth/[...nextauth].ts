// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "lib/mongodb";
import { compare } from "bcryptjs";
import { getUser } from "api/services/User";

export default NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dhe fjalëkalimi janë të detyrueshëm");
        }
        const user = await getUser(credentials.email);
        if (!user) {
          throw new Error("Email-i nuk ekziston");
        }
        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Fjalëkalimi nuk është i saktë");
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isSuperUser: user.isSuperUser || false
        };
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isSuperUser = user.isSuperUser; // Add isSuperUser to token
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.isSuperUser = token.isSuperUser; // Add isSuperUser to session user
      }
      return session;
    }
  },
  debug: process.env.NODE_ENV === "development"
});

// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "lib/mongodb";
import { compare } from "bcryptjs";
import { getUser, getOrCreateOAuthUser } from "api/services/User";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

// Create the options object for better typing
const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  // Force cookie handling using secure cookies for the session
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
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
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Handle URL redirection
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.isSuperUser = user.isSuperUser || false;
      }
      
      // Store the account provider in the token if available
      if (account) {
        token.provider = account.provider;
      }
      
      // For Google sign-in, store the image URL
      if (profile && account?.provider === 'google') {
        // Use type assertion since profile structure varies by provider
        const googleProfile = profile as { picture?: string };
        if (googleProfile.picture) {
          token.picture = googleProfile.picture;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isSuperUser = token.isSuperUser as boolean;
        // Include the provider information in the session
        if (token.provider) {
          session.user.provider = token.provider as string;
        }
        // Include the image if available from OAuth providers
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    async signIn({ user, account, profile, credentials }) {
      // For OAuth sign-ins (Google, etc.)
      if (account && account.provider === "google" && profile && profile.email) {
        try {
          // Log the sign-in attempt for debugging
          console.log('Google sign-in attempt:', { email: profile.email });
          
          // Get the image from the profile if it exists
          const googleProfile = profile as { picture?: string, email: string, name?: string };
          const profileImage = googleProfile.picture;
          
          // Call the helper function to get or create the user
          const oauthUser = await getOrCreateOAuthUser(
            googleProfile.email,
            googleProfile.name || googleProfile.email.split('@')[0],
            account.provider,
            profileImage
          );
          
          if (oauthUser) {
            // If the user exists or was created successfully, allow sign-in
            console.log('Google sign-in successful for:', googleProfile.email);
            return true;
          }
        } catch (error) {
          console.error('OAuth sign-in error:', error);
          return false;
        }
      }
      
      // For credentials or other sign-in methods, allow the default behavior
      return true;
    }
  },
  debug: process.env.NODE_ENV === "development"
});

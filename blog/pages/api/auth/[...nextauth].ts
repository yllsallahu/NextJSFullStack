// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { compare } from "bcryptjs";
import { getUser, getOrCreateOAuthUser } from "../../../src/api/services/User";
import { linkOAuthAccount, hasCredentialsAccount } from "../../../src/api/services/linkAccountFix";
import { Adapter } from "next-auth/adapters";  // Import Adapter type

// Helper function to safely create the MongoDB adapter
function createMongoDBAdapter(): Adapter | undefined {
  try {
    // Only create adapter if we have a MongoDB URI and we're not in build mode
    if (!process.env.MONGODB_URI) {
      console.warn('MongoDB adapter disabled: MONGODB_URI not found');
      return undefined;
    }
    
    // Use the same build-time detection logic as mongodb.ts
    const isBuildTime = typeof window === 'undefined' && (
      // During Vercel build process (VERCEL_URL is not available during build, only at runtime)
      (process.env.VERCEL === '1' && !process.env.VERCEL_URL) ||
      // During CI builds
      process.env.CI === 'true' ||
      // Explicit build flag
      process.env.NEXT_PHASE === 'phase-production-build'
    );

    if (isBuildTime) {
      console.warn('MongoDB adapter disabled during build time');
      return undefined;
    }
    
    // Dynamically import clientPromise only when needed
    const clientPromise = require("../../../src/lib/mongodb").default;
    return MongoDBAdapter(clientPromise) as Adapter;
  } catch (error) {
    console.warn('MongoDB adapter creation failed:', error);
    return undefined;
  }
}

// Define the auth options
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: createMongoDBAdapter(),
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
          response_type: "code",
          redirect_uri: process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` : undefined
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
        
        try {
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
        } catch (error) {
          console.error('Authorization error:', error);
          
          // If this is a database connection error, provide a more helpful message
          if (error instanceof Error && error.message.includes('Database connection not available during build')) {
            throw new Error("Shërbimi i autentifikimit nuk është i disponueshëm");
          }
          
          // Re-throw the original error
          throw error;
        }
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
    async redirect({ url, baseUrl }) {
      // Log the redirect attempt for debugging
      console.log(`NextAuth redirect: URL=${url}, baseUrl=${baseUrl}`);
      
      // Handle relative URLs (starting with /)
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log(`Redirecting to: ${redirectUrl}`);
        return redirectUrl;
      } 
      // Handle absolute URLs that match our base URL
      else if (new URL(url).origin === baseUrl) {
        console.log(`Redirecting to same-origin URL: ${url}`);
        return url;
      }
      
      // Default to home page for any other cases
      console.log(`Redirecting to base URL: ${baseUrl}`);
      return baseUrl;
    },    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        token.isSuperUser = user.isSuperUser || false;
      }
      
      if (account) {
        token.provider = account.provider;
      }
      
      if (profile && account?.provider === 'google') {
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
        
        if (token.provider) {
          session.user.provider = token.provider as string;
        }
        
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    async signIn({ account, profile }) {
      // Enhanced handling for Google OAuth sign-in to fix account linking issues
      if (account?.provider === "google" && profile?.email) {
        try {
          console.log('🔑 Processing Google sign-in for:', profile.email);
          
          // Get the profile data
          const googleProfile = profile as { picture?: string, email: string, name?: string, sub?: string };
          const userEmail = googleProfile.email;
          const profileImage = googleProfile.picture;
          
          // Check if this email has a credentials account (password-based)
          const hasCredentials = await hasCredentialsAccount(userEmail);
          
          if (hasCredentials) {
            console.log(`🔄 Email ${userEmail} has existing credentials account. Linking with OAuth...`);
          }
          
          // ALWAYS try the direct link approach for every Google sign-in
          if (account.providerAccountId) {
            const linkResult = await linkOAuthAccount(
              userEmail,
              account.providerAccountId,
              account.provider
            );
            
            if (linkResult) {
              console.log('✅ Successfully linked account for', userEmail);
              return true;
            }
          }
          
          // If direct linking didn't work, check if user exists
          const existingUser = await getUser(userEmail);
          
          if (existingUser) {
            console.log(`👤 Found existing user but couldn't link: ${userEmail}`);
            
            // If user exists but we couldn't link, we'll still allow sign-in
            // The NextAuth adapter should handle this case
            return true;
          } else {
            console.log(`🆕 Creating new user for ${userEmail}`);
            // For new users, create a user record
            const oauthUser = await getOrCreateOAuthUser(
              userEmail,
              googleProfile.name || userEmail.split('@')[0],
              account.provider,
              profileImage
            );
            
            if (oauthUser) {
              console.log('✅ New Google account created successfully:', userEmail);
              return true;
            }
          }
        } catch (error) {
          console.error('❌ OAuth sign-in error:', error);
          
          // If this is a database connection error, we should still allow the sign-in
          // to proceed so NextAuth can handle it with its own adapter
          if (error instanceof Error && error.message.includes('Database connection not available during build')) {
            console.warn('Database unavailable during OAuth sign-in, allowing NextAuth adapter to handle');
            return true;
          }
          
          // We should still allow the sign-in since errors here are likely our custom code
          return true;
        }
      }
      
      // For credentials or other sign-in methods, allow the default behavior
      return true;
    }
  },
  debug: process.env.NODE_ENV === "development"
};

export default NextAuth(authOptions);

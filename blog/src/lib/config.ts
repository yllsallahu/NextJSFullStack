/**
 * Configuration settings to ensure proper OAuth redirects
 */

// For client-side requests
export const publicRuntimeConfig = {
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  googleCallbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
  // Add a debug flag for development
  debug: process.env.NODE_ENV === 'development'
};

// For server-side requests
export const serverRuntimeConfig = {
  nextAuthSecret: process.env.NEXTAUTH_SECRET,
  mongo: {
    uri: process.env.MONGODB_URI
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }
  }
};

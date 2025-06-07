import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;
const options = {
  // Recommended MongoClient options
  retryWrites: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
};

let clientPromise: Promise<MongoClient>;

// Initialize clientPromise immediately to support both named and default exports
if (!uri) {
  // During Vercel build or CI, throw a more specific error
  if (process.env.VERCEL_ENV || process.env.CI) {
    // Create a promise that will reject with a specific error for build time
    clientPromise = Promise.reject(new Error('Database connection not available during build'));
  } else {
    clientPromise = Promise.reject(new Error('MONGODB_URI environment variable is required'));
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

// Helper function to connect to database and return both client and db
export async function connectToDatabase() {
  // If no URI is provided, check if we're in build or production environment
  if (!uri) {
    // During Vercel build, throw a more specific error that can be caught
    if (process.env.VERCEL_ENV || process.env.CI || process.env.NODE_ENV === 'production') {
      throw new Error('Database connection not available during build');
    }
    throw new Error('MONGODB_URI environment variable is required');
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    return { client, db };
  } catch (error) {
    // If the clientPromise was rejected due to build-time issues, re-throw with clearer message
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      throw error;
    }
    throw new Error('Failed to connect to database');
  }
}

// Export clientPromise as default to support direct imports
export default clientPromise;

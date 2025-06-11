import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;
// Vercel-optimized MongoDB connection options to fix SSL/TLS issues
const options = {
  // Connection timeouts
  serverSelectionTimeoutMS: 5000, // Reduced timeout for faster failure detection
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 1, // Reduced minimum for Vercel serverless
  maxIdleTimeMS: 30000,
  
  // Retry settings
  retryWrites: true,
  retryReads: true,
  
  // SSL/TLS settings optimized for Vercel + MongoDB Atlas
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  
  // Additional options to resolve SSL handshake issues on Vercel
  directConnection: false, // Let MongoDB driver handle connection routing
  appName: 'NextJSFullStackBlog', // App name for MongoDB logs
};

let clientPromise: Promise<MongoClient> | null = null;

// Function to initialize client promise lazily
function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  // Improved build-time detection for Vercel and other environments
  const isBuildTime = typeof window === 'undefined' && (
    // During Vercel build process (VERCEL_URL is not available during build, only at runtime)
    (process.env.VERCEL === '1' && !process.env.VERCEL_URL) ||
    // During CI builds
    process.env.CI === 'true' ||
    // Explicit build flag
    process.env.NEXT_PHASE === 'phase-production-build'
  );

  if (isBuildTime) {
    // Return a rejected promise that can be caught
    clientPromise = Promise.reject(new Error('Database connection not available during build'));
    return clientPromise;
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
        console.error('MongoDB connection failed:', error);
        // Reset the promise so it can be retried
        globalWithMongo._mongoClientPromise = undefined;
        throw error;
      });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    const client = new MongoClient(uri, options);
    clientPromise = client.connect().catch(async (error) => {
      console.error('MongoDB connection failed with primary options:', error);
      
      // If we get SSL/TLS errors on Vercel, try with alternative settings
      if (error.message.includes('SSL') || error.message.includes('TLS') || error.message.includes('ssl3_read_bytes')) {
        console.log('Retrying with alternative SSL settings...');
        
        const fallbackOptions = {
          ...options,
          serverSelectionTimeoutMS: 3000, // Even shorter timeout for fallback
          tls: true,
          ssl: true, // Explicit SSL flag
          sslValidate: false, // More permissive SSL validation for Vercel
        };
        
        try {
          const fallbackClient = new MongoClient(uri, fallbackOptions);
          return await fallbackClient.connect();
        } catch (fallbackError) {
          console.error('Fallback connection also failed:', fallbackError);
          throw error; // Throw original error
        }
      }
      
      // Reset the promise so it can be retried
      clientPromise = null;
      throw error;
    });
  }

  return clientPromise;
}

// Helper function to connect to database and return both client and db
export async function connectToDatabase() {
  try {
    const client = await getClientPromise();
    const db = client.db();
    return { client, db };
  } catch (error) {
    // If the clientPromise was rejected due to build-time issues, re-throw with clearer message
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      throw error;
    }
    
    // Handle specific MongoDB connection errors
    if (error instanceof Error) {
      if (error.message.includes('MongoServerSelectionError') || error.message.includes('SSL') || error.message.includes('TLS')) {
        console.error('MongoDB SSL/TLS Connection Error:', error.message);
        throw new Error('Failed to establish secure connection to MongoDB. Please check your connection settings.');
      }
      if (error.message.includes('authentication')) {
        console.error('MongoDB Authentication Error:', error.message);
        throw new Error('Failed to authenticate with MongoDB. Please check your credentials.');
      }
    }
    
    console.error('MongoDB Connection Error:', error);
    throw new Error('Failed to connect to database');
  }
}

// Export clientPromise as default to support direct imports
export default getClientPromise;

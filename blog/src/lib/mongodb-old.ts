import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;

// Check if URI already contains ssl=false to avoid conflicts
const uriHasSSLDisabled = uri?.includes('ssl=false') || uri?.includes('tls=false') || false;

// MongoDB connection options that respect URI SSL settings
const getConnectionOptions = () => {
  const isVercel = process.env.VERCEL === '1';
  
  // Base options without any SSL/TLS settings
  const baseOptions = {
    serverSelectionTimeoutMS: isVercel ? 5000 : 10000,
    connectTimeoutMS: isVercel ? 8000 : 10000,
    socketTimeoutMS: isVercel ? 30000 : 45000,
    retryWrites: true,
    appName: 'NextJSFullStackBlog',
  };

  // If URI explicitly disables SSL, don't add any SSL/TLS options
  if (uriHasSSLDisabled) {
    console.log('� Using non-SSL connection (SSL disabled in URI)');
    return baseOptions;
  }

  // Only add SSL options if URI doesn't disable SSL
  console.log('🔐 Using SSL connection (SSL enabled)');
  return {
    ...baseOptions,
    tls: true,
    tlsAllowInvalidCertificates: isVercel, // More permissive on Vercel
    tlsAllowInvalidHostnames: isVercel,
  };
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
      const client = new MongoClient(uri, getConnectionOptions());
      globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
        console.error('MongoDB connection failed:', error);
        // Reset the promise so it can be retried
        globalWithMongo._mongoClientPromise = undefined;
        throw error;
      });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // Production mode - simplified connection logic
    const connectWithRetry = async (): Promise<MongoClient> => {
      const isVercel = process.env.VERCEL === '1';
      console.log(`🔌 Attempting MongoDB connection (Vercel: ${isVercel}, SSL disabled in URI: ${uriHasSSLDisabled})`);
      
      try {
        // Single connection attempt with proper options based on URI
        const client = new MongoClient(uri, getConnectionOptions());
        return await client.connect();
      } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        
        // If this is a SSL/TLS mismatch error and URI doesn't disable SSL, try minimal config
        if (error instanceof Error && 
            error.message.includes('All values of tls/ssl must be the same') &&
            !uriHasSSLDisabled) {
          console.log('� Retrying with minimal configuration...');
          
          try {
            const minimalClient = new MongoClient(uri, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 5000,
              retryWrites: true,
              appName: 'NextJSFullStackBlog',
            });
            return await minimalClient.connect();
          } catch (fallbackError) {
            console.error('❌ Minimal configuration also failed:', fallbackError);
            throw error; // Throw original error for debugging
          }
        }
        
        throw error;
      }
    };

    clientPromise = connectWithRetry().catch((error) => {
      console.error('MongoDB connection completely failed:', error);
      clientPromise = null; // Reset for retry
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

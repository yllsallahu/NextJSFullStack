import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;
// Vercel-specific MongoDB connection handling
const getConnectionOptions = (isRetry = false) => {
  const isVercel = process.env.VERCEL === '1';
  
  if (isRetry || isVercel) {
    // Vercel-optimized options to handle SSL issues
    return {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 5000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      appName: 'NextJSFullStackBlog',
      // Vercel-specific SSL settings
      tls: true,
      tlsAllowInvalidCertificates: true, // More permissive for Vercel
      tlsAllowInvalidHostnames: true,    // More permissive for Vercel
      tlsInsecure: true,                 // Allow insecure connections
    };
  }
  
  // Local development options (standard SSL)
  return {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
    directConnection: false,
    appName: 'NextJSFullStackBlog',
  };
};

// Helper function to modify URI for fallback connection
const getFallbackUri = (originalUri: string): string => {
  if (!originalUri) return originalUri;
  
  // Remove SSL parameters and add ssl=false
  const url = new URL(originalUri);
  url.searchParams.set('ssl', 'false');
  url.searchParams.set('tls', 'false');
  url.searchParams.delete('tlsAllowInvalidCertificates');
  url.searchParams.delete('tlsAllowInvalidHostnames');
  
  return url.toString();
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
    // In production mode, optimize for Vercel
    const connectWithVercelOptimization = async (): Promise<MongoClient> => {
      const isVercel = process.env.VERCEL === '1';
      console.log(`Connecting to MongoDB (Vercel: ${isVercel})`);
      
      try {
        // Use Vercel-optimized settings from the start if on Vercel
        const options = getConnectionOptions(isVercel);
        console.log('Connection options:', { ...options, /* hide sensitive data */ });
        
        const client = new MongoClient(uri, options);
        const connectedClient = await client.connect();
        console.log('✅ MongoDB connection successful');
        return connectedClient;
      } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        
        // If we're on Vercel and still getting SSL errors, try one more fallback
        if (isVercel && error instanceof Error && (
          error.message.includes('SSL') || 
          error.message.includes('TLS') || 
          error.message.includes('ssl3_read_bytes') ||
          error.message.includes('tlsv1 alert internal error') ||
          error.message.includes('alert number 80')
        )) {
          console.log('🔄 Trying final fallback for Vercel SSL issues...');
          
          try {
            // Final fallback: minimal options
            const minimalOptions = {
              serverSelectionTimeoutMS: 2000,
              connectTimeoutMS: 3000,
              retryWrites: true,
              appName: 'NextJSFullStackBlog',
            };
            
            const fallbackClient = new MongoClient(uri, minimalOptions);
            return await fallbackClient.connect();
          } catch (fallbackError) {
            console.error('❌ Final fallback also failed:', fallbackError);
            throw error; // Throw original error for better debugging
          }
        }
        
        throw error;
      }
    };
    
    clientPromise = connectWithVercelOptimization().catch((error) => {
      console.error('All MongoDB connection attempts failed:', error);
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

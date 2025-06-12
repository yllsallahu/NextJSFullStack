import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Optimized connection specifically for Vercel serverless
const getVercelOptions = () => {
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    console.log('🔧 Using Vercel-optimized MongoDB settings');
    return {
      // Shorter timeouts for serverless
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      
      // Essential settings
      retryWrites: true,
      maxPoolSize: 1, // Important for serverless
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
      
      // Try without SSL first for Vercel
      tls: false,
      ssl: false,
      
      // App identification
      appName: 'NextJSFullStackBlog',
    };
  }
  
  // Development/production settings
  return {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
    retryWrites: true,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    appName: 'NextJSFullStackBlog',
  };
};

// Create clean URI without SSL conflicts
const createCleanUri = (originalUri: string, forceNoSSL = false): string => {
  if (!originalUri) return originalUri;
  
  try {
    const url = new URL(originalUri);
    
    // Remove all SSL/TLS parameters to avoid conflicts
    url.searchParams.delete('ssl');
    url.searchParams.delete('tls'); 
    url.searchParams.delete('tlsAllowInvalidCertificates');
    url.searchParams.delete('tlsAllowInvalidHostnames');
    
    if (forceNoSSL) {
      url.searchParams.set('ssl', 'false');
    }
    
    return url.toString();
  } catch (error) {
    console.error('Failed to clean URI:', error);
    return originalUri;
  }
};

let clientPromise: Promise<MongoClient> | null = null;

// Function to initialize client promise lazily
function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  // Build-time detection for Vercel and other environments
  const isBuildTime = typeof window === 'undefined' && (
    (process.env.VERCEL === '1' && !process.env.VERCEL_URL) ||
    process.env.CI === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  );

  if (isBuildTime) {
    clientPromise = Promise.reject(new Error('Database connection not available during build'));
    return clientPromise;
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  if (process.env.NODE_ENV === 'development') {
    // Development mode with HMR support
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      const cleanUri = createCleanUri(uri);
      const client = new MongoClient(cleanUri, getConnectionOptions(true));
      globalWithMongo._mongoClientPromise = client.connect().catch((error) => {
        console.error('MongoDB connection failed in development:', error);
        globalWithMongo._mongoClientPromise = undefined;
        throw error;
      });
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // Production mode with aggressive Vercel SSL bypass
    const connectWithRetry = async (): Promise<MongoClient> => {
      const isVercel = process.env.VERCEL === '1';
      console.log(`🔌 MongoDB connection attempt (Vercel: ${isVercel})`);
      
      if (isVercel) {
        // For Vercel: Start with non-SSL since SSL consistently fails
        try {
          console.log('� Vercel Attempt 1: Non-SSL connection (default for Vercel)');
          const noSSLUri = createCleanUri(uri, true);
          const fallbackClient = new MongoClient(noSSLUri, getConnectionOptions(false));
          const connectedClient = await fallbackClient.connect();
          console.log('✅ Non-SSL connection successful on Vercel');
          return connectedClient;
        } catch (noSSLError) {
          const noSSLMessage = noSSLError instanceof Error ? noSSLError.message : 'Unknown non-SSL error';
          console.log('❌ Non-SSL connection failed on Vercel:', noSSLMessage);
          
          // Fallback: Try minimal configuration
          try {
            console.log('⚡ Vercel Attempt 2: Minimal configuration');
            const baseUri = createCleanUri(uri, false);
            const minimalClient = new MongoClient(baseUri, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 5000,
              retryWrites: true,
              appName: 'NextJSFullStackBlog',
            });
            const connectedClient = await minimalClient.connect();
            console.log('✅ Minimal connection successful on Vercel');
            return connectedClient;
          } catch (minimalError) {
            console.error('❌ All Vercel connection attempts failed');
            throw noSSLError; // Throw the first error for debugging
          }
        }
      } else {
        // For non-Vercel production: Try SSL first
        try {
          console.log('� Non-Vercel Attempt 1: SSL connection');
          const cleanUri = createCleanUri(uri, false);
          const client = new MongoClient(cleanUri, getConnectionOptions(true));
          const connectedClient = await client.connect();
          console.log('✅ SSL connection successful');
          return connectedClient;
        } catch (sslError) {
          const errorMessage = sslError instanceof Error ? sslError.message : 'Unknown SSL error';
          console.log('❌ SSL connection failed:', errorMessage);
          
          // Second attempt: Try without SSL
          try {
            console.log('🔓 Non-Vercel Attempt 2: Non-SSL connection');
            const noSSLUri = createCleanUri(uri, true);
            const fallbackClient = new MongoClient(noSSLUri, getConnectionOptions(false));
            const connectedClient = await fallbackClient.connect();
            console.log('✅ Non-SSL connection successful');
            return connectedClient;
          } catch (fallbackError) {
            const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
            console.log('❌ Non-SSL connection failed:', fallbackMessage);
            throw sslError; // Throw the original SSL error
          }
        }
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
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.message.includes('MongoServerSelectionError') || error.message.includes('SSL') || error.message.includes('TLS')) {
        console.error('MongoDB SSL/TLS Connection Error:', error.message);
        throw new Error('Failed to establish connection to MongoDB. Please check your connection settings.');
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

export default getClientPromise;

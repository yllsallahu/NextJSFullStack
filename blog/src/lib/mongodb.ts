import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;

// Clean connection options for Vercel
const getConnectionOptions = (useSSL = true) => {
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    // Vercel-specific settings
    if (useSSL) {
      return {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        appName: 'NextJSFullStackBlog',
        // SSL enabled with permissive settings for Vercel
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      };
    } else {
      return {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        appName: 'NextJSFullStackBlog',
        // SSL completely disabled
        tls: false,
        ssl: false,
      };
    }
  }
  
  // Local development - standard settings
  return {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 5,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    appName: 'NextJSFullStackBlog',
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames: false,
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
    // Production mode with smart retry logic
    const connectWithRetry = async (): Promise<MongoClient> => {
      const isVercel = process.env.VERCEL === '1';
      console.log(`🔌 MongoDB connection attempt (Vercel: ${isVercel})`);
      
      // First attempt: Try with SSL enabled
      try {
        console.log('🔐 Attempt 1: SSL connection');
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
          console.log('🔓 Attempt 2: Non-SSL connection');
          const noSSLUri = createCleanUri(uri, true);
          const fallbackClient = new MongoClient(noSSLUri, getConnectionOptions(false));
          const connectedClient = await fallbackClient.connect();
          console.log('✅ Non-SSL connection successful');
          return connectedClient;
        } catch (fallbackError) {
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
          console.log('❌ Non-SSL connection failed:', fallbackMessage);
          
          // Final attempt: Minimal configuration
          try {
            console.log('⚡ Attempt 3: Minimal configuration');
            const baseUri = createCleanUri(uri, false);
            const minimalClient = new MongoClient(baseUri, {
              serverSelectionTimeoutMS: 3000,
              connectTimeoutMS: 5000,
              retryWrites: true,
              appName: 'NextJSFullStackBlog',
            });
            const connectedClient = await minimalClient.connect();
            console.log('✅ Minimal connection successful');
            return connectedClient;
          } catch (minimalError) {
            console.error('❌ All connection attempts failed');
            throw sslError; // Throw the first error for debugging
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

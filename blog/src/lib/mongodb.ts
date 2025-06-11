import { MongoClient } from 'mongodb';

// Allow build to continue without MongoDB URI 
const uri = process.env.MONGODB_URI;

// Vercel-specific MongoDB connection handling with aggressive SSL fix
const getConnectionOptions = (disableSSL = false) => {
  const isVercel = process.env.VERCEL === '1';
  
  if (isVercel) {
    if (disableSSL) {
      // Complete SSL bypass for Vercel
      console.log('🔄 Using non-SSL connection for Vercel (SSL bypass)');
      return {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        appName: 'NextJSFullStackBlog',
        // Completely disable SSL
        tls: false,
        ssl: false,
      };
    } else {
      // Try SSL first on Vercel
      console.log('🔐 Attempting SSL connection on Vercel');
      return {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 8000,
        socketTimeoutMS: 30000,
        retryWrites: true,
        appName: 'NextJSFullStackBlog',
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      };
    }
  }
  
  // Local development options (standard SSL)
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

// Helper function to modify URI for non-SSL connection
const getNoSSLUri = (originalUri: string): string => {
  if (!originalUri) return originalUri;
  
  try {
    const url = new URL(originalUri);
    url.searchParams.set('ssl', 'false');
    url.searchParams.set('tls', 'false');
    url.searchParams.delete('tlsAllowInvalidCertificates');
    url.searchParams.delete('tlsAllowInvalidHostnames');
    return url.toString();
  } catch (error) {
    console.error('Failed to modify URI:', error);
    return originalUri;
  }
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
    // Production mode - with aggressive Vercel SSL fixes
    const isVercel = process.env.VERCEL === '1';
    
    const connectWithRetry = async (): Promise<MongoClient> => {
      console.log(`🔌 Attempting MongoDB connection (Vercel: ${isVercel})`);
      
      try {
        // First attempt: Try with SSL
        console.log('🔐 Attempt 1: Standard SSL connection');
        const client = new MongoClient(uri, getConnectionOptions(false));
        return await client.connect();
      } catch (error) {
        console.error('❌ SSL connection failed:', error);
        
        // Check for specific SSL errors
        if (error instanceof Error && (
          error.message.includes('SSL') || 
          error.message.includes('TLS') || 
          error.message.includes('ssl3_read_bytes') ||
          error.message.includes('tlsv1 alert internal error') ||
          error.message.includes('alert number 80')
        )) {
          console.log('🔄 Retrying with SSL disabled...');
          
          try {
            // Second attempt: Disable SSL completely
            const noSSLUri = getNoSSLUri(uri);
            console.log('🔓 Attempt 2: Non-SSL connection');
            const fallbackClient = new MongoClient(noSSLUri, getConnectionOptions(true));
            return await fallbackClient.connect();
          } catch (fallbackError) {
            console.error('❌ Non-SSL connection also failed:', fallbackError);
            
            try {
              // Final attempt: Minimal options
              console.log('⚡ Attempt 3: Minimal configuration');
              const minimalClient = new MongoClient(uri, {
                serverSelectionTimeoutMS: 3000,
                connectTimeoutMS: 5000,
                retryWrites: true,
                appName: 'NextJSFullStackBlog',
              });
              return await minimalClient.connect();
            } catch (minimalError) {
              console.error('❌ All connection attempts failed');
              throw error; // Throw original SSL error for debugging
            }
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

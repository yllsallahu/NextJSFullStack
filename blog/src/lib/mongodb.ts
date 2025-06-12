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

// Clean the URI to remove conflicting SSL parameters
const cleanUri = (originalUri: string): string => {
  if (!originalUri) return originalUri;
  
  try {
    const url = new URL(originalUri);
    
    // Remove all SSL/TLS related parameters to avoid conflicts
    const sslParams = [
      'ssl', 'tls', 'tlsAllowInvalidCertificates', 
      'tlsAllowInvalidHostnames', 'tlsInsecure'
    ];
    
    sslParams.forEach(param => url.searchParams.delete(param));
    
    // For Vercel, explicitly disable SSL in URI
    if (process.env.VERCEL === '1') {
      url.searchParams.set('ssl', 'false');
    }
    
    return url.toString();
  } catch (error) {
    console.error('Failed to parse URI:', error);
    return originalUri;
  }
};

let cachedClient: MongoClient | null = null;
let cachedPromise: Promise<MongoClient> | null = null;

async function connectToMongoDB(): Promise<MongoClient> {
  // Build-time check
  const isBuildTime = typeof window === 'undefined' && (
    (process.env.VERCEL === '1' && !process.env.VERCEL_URL) ||
    process.env.CI === 'true' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  );

  if (isBuildTime) {
    throw new Error('Database connection not available during build');
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Return cached client if available
  if (cachedClient) {
    try {
      // Test if connection is still alive
      await cachedClient.db().admin().ping();
      console.log('♻️ Reusing existing MongoDB connection');
      return cachedClient;
    } catch (error) {
      console.log('🔄 Cached connection expired, creating new one');
      cachedClient = null;
    }
  }

  // Return cached promise if connection is in progress
  if (cachedPromise) {
    console.log('⏳ Waiting for ongoing MongoDB connection');
    return cachedPromise;
  }

  const isVercel = process.env.VERCEL === '1';
  console.log(`🔌 Creating new MongoDB connection (Vercel: ${isVercel})`);

  cachedPromise = (async () => {
    try {
      const cleanedUri = cleanUri(uri);
      const options = getVercelOptions();
      
      console.log('📋 Connection options:', {
        serverSelectionTimeoutMS: options.serverSelectionTimeoutMS,
        tls: options.tls,
        ssl: options.ssl,
        maxPoolSize: options.maxPoolSize,
      });

      const client = new MongoClient(cleanedUri, options);
      
      // Connect with timeout
      await client.connect();
      
      // Test the connection
      await client.db().admin().ping();
      
      console.log('✅ MongoDB connection successful');
      
      cachedClient = client;
      cachedPromise = null; // Clear the promise since we have the client
      
      return client;
      
    } catch (error) {
      cachedPromise = null; // Reset on failure
      console.error('❌ MongoDB connection failed:', error);
      
      // If SSL/TLS error on first attempt, try with SSL enabled
      if (isVercel && error instanceof Error && 
          (error.message.includes('SSL') || error.message.includes('TLS'))) {
        
        console.log('🔄 Retrying with SSL enabled...');
        
        try {
          const optionsWithSSL = {
            ...getVercelOptions(),
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
          };
          
          const clientWithSSL = new MongoClient(uri, optionsWithSSL);
          await clientWithSSL.connect();
          await clientWithSSL.db().admin().ping();
          
          console.log('✅ MongoDB connection successful with SSL');
          cachedClient = clientWithSSL;
          return clientWithSSL;
          
        } catch (sslError) {
          console.error('❌ SSL retry also failed:', sslError);
          throw error; // Throw original error
        }
      }
      
      throw error;
    }
  })();

  return cachedPromise;
}

// Main export function
export default async function getClientPromise(): Promise<MongoClient> {
  return connectToMongoDB();
}

// Helper function for database operations
export async function connectToDatabase() {
  try {
    const client = await connectToMongoDB();
    const db = client.db('myapp'); // Use your database name
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to database:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Database connection not available during build')) {
        throw error;
      }
      
      // Provide helpful error messages
      if (error.message.includes('authentication')) {
        throw new Error('Database authentication failed. Check your MongoDB credentials.');
      }
      
      if (error.message.includes('network') || error.message.includes('timeout')) {
        throw new Error('Database connection timeout. Check your network and MongoDB Atlas settings.');
      }
    }
    
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

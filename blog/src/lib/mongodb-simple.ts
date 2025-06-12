import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

// Ultra-simple connection options specifically for Vercel
const getVercelConnectionOptions = () => ({
  serverSelectionTimeoutMS: 3000,
  connectTimeoutMS: 5000,
  socketTimeoutMS: 15000,
  retryWrites: true,
  // Explicitly disable ALL SSL/TLS for Vercel
  tls: false,
  ssl: false,
});

// Clean URI by removing ALL SSL/TLS parameters
const createCleanUri = (originalUri: string): string => {
  if (!originalUri) return originalUri;
  
  try {
    const url = new URL(originalUri);
    // Remove ALL possible SSL/TLS parameters
    const sslParams = ['ssl', 'tls', 'tlsAllowInvalidCertificates', 'tlsAllowInvalidHostnames', 'tlsInsecure'];
    sslParams.forEach(param => url.searchParams.delete(param));
    
    // Force SSL to false for Vercel
    url.searchParams.set('ssl', 'false');
    
    return url.toString();
  } catch (error) {
    console.error('Failed to clean URI:', error);
    return originalUri;
  }
};

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) {
    return clientPromise;
  }

  // Check if we're at build time
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

  const isVercel = process.env.VERCEL === '1';
  console.log(`🔌 MongoDB connection (Vercel: ${isVercel})`);

  if (isVercel) {
    // VERCEL: Ultra-simple non-SSL connection
    console.log('🔓 Vercel: Using non-SSL configuration');
    const cleanUri = createCleanUri(uri);
    const client = new MongoClient(cleanUri, getVercelConnectionOptions());
    
    clientPromise = client.connect()
      .then(connectedClient => {
        console.log('✅ Vercel MongoDB connection successful');
        return connectedClient;
      })
      .catch(error => {
        console.error('❌ Vercel MongoDB connection failed:', error);
        clientPromise = null; // Reset for retry
        throw error;
      });
  } else if (process.env.NODE_ENV === 'development') {
    // DEVELOPMENT: Use global cache
    let globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        retryWrites: true,
      });
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // PRODUCTION (non-Vercel): Standard SSL connection
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    });
    clientPromise = client.connect();
  }

  return clientPromise;
}

// Helper function to connect to database
export async function connectToDatabase() {
  try {
    const client = await getClientPromise();
    const db = client.db();
    return { client, db };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database connection not available during build')) {
      throw error;
    }
    
    console.error('MongoDB Connection Error:', error);
    throw new Error('Failed to connect to database');
  }
}

export default getClientPromise;

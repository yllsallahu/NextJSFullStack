// pages/api/test-connection.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from '../../src/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("🔍 Testing connection - Step 1: Environment check");
    
    // Check environment variables
    const hasMongoURI = !!process.env.MONGODB_URI;
    const hasSecret = !!process.env.NEXTAUTH_SECRET;
    
    console.log("Environment variables:");
    console.log("- MONGODB_URI:", hasMongoURI);
    console.log("- NEXTAUTH_SECRET:", hasSecret);
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- VERCEL:", process.env.VERCEL);
    
    if (!hasMongoURI) {
      return res.status(500).json({
        error: "MONGODB_URI environment variable is missing",
        debug: { hasMongoURI, hasSecret }
      });
    }
    
    console.log("🔍 Testing connection - Step 2: Import MongoDB client");
    
    // Try to import the MongoDB client
    console.log("Attempting to connect to MongoDB...");
    console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//****:****@'));
    
    const client = await clientPromise;
    console.log("✅ MongoDB client imported successfully");
    
    console.log("🔍 Testing connection - Step 3: Call client function");
    
    // Try to get the client
    console.log("Database selected successfully");
    
    console.log("🔍 Testing connection - Step 4: Connect to database");
    
    // Try to connect to the database
    const db = client.db("myapp");
    console.log("✅ Database reference created");
    
    console.log("🔍 Testing connection - Step 5: Ping database");
    
    // Try to ping the database
    await db.command({ ping: 1 });
    console.log("✅ Database ping successful");
    
    // Get the connection string (without password)
    const uri = process.env.MONGODB_URI || '';
    const sanitizedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    
    return res.status(200).json({
      success: true,
      message: "Successfully connected to MongoDB",
      connectionString: sanitizedUri,
      database: "myapp",
      cluster: "FinalNextJs",
      environment: {
        hasMongoURI,
        hasSecret,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      }
    });
    
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    
    // Get more detailed error information
    const errorDetails = {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      code: (error as any)?.code,
      codeName: (error as any)?.codeName
    };
    
    return res.status(500).json({ 
      success: false, 
      error: errorDetails,
      connectionString: process.env.MONGODB_URI ? '***' : 'Not set',
      environment: {
        hasMongoURI: !!process.env.MONGODB_URI,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      }
    });
  }
}

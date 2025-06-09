// pages/api/test-connection.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    const clientPromise = require("../../src/lib/mongodb").default;
    console.log("✅ MongoDB client imported successfully");
    
    console.log("🔍 Testing connection - Step 3: Call client function");
    
    // Try to get the client
    const client = await clientPromise();
    console.log("✅ MongoDB client created successfully");
    
    console.log("🔍 Testing connection - Step 4: Connect to database");
    
    // Try to connect to the database
    const db = client.db("myapp");
    console.log("✅ Database reference created");
    
    console.log("🔍 Testing connection - Step 5: Ping database");
    
    // Try to ping the database
    const pingResult = await db.admin().ping();
    console.log("✅ Database ping successful:", pingResult);
    
    return res.status(200).json({
      success: true,
      message: "Database connection successful",
      ping: pingResult,
      environment: {
        hasMongoURI,
        hasSecret,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      }
    });
    
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    
    return res.status(500).json({
      error: "Database connection test failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        hasMongoURI: !!process.env.MONGODB_URI,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      }
    });
  }
}

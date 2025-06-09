// pages/api/debug-db.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../src/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Debug DB Test Starting...");
    console.log("Environment variables check:");
    console.log("- MONGODB_URI exists:", !!process.env.MONGODB_URI);
    console.log("- VERCEL:", process.env.VERCEL);
    console.log("- VERCEL_URL:", process.env.VERCEL_URL);
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    
    // Test if we're in build time
    const isBuildTime = typeof window === 'undefined' && (
      (process.env.VERCEL === '1' && !process.env.VERCEL_URL) ||
      process.env.CI === 'true' ||
      process.env.NEXT_PHASE === 'phase-production-build'
    );
    
    console.log("- Is build time?", isBuildTime);
    
    if (isBuildTime) {
      return res.status(503).json({ 
        error: "Running in build time mode",
        debug: {
          VERCEL: process.env.VERCEL,
          VERCEL_URL: process.env.VERCEL_URL,
          CI: process.env.CI,
          NEXT_PHASE: process.env.NEXT_PHASE
        }
      });
    }
    
    // Try to connect to MongoDB
    console.log("🔌 Attempting MongoDB connection...");
    const client = await clientPromise();
    console.log("✅ MongoDB connection successful");
    
    // Test a simple operation
    const db = client.db("myapp");
    const result = await db.admin().ping();
    console.log("✅ MongoDB ping successful:", result);
    
    return res.status(200).json({
      success: true,
      message: "Database connection successful",
      ping: result,
      env: {
        VERCEL: process.env.VERCEL,
        NODE_ENV: process.env.NODE_ENV,
        hasMongoURI: !!process.env.MONGODB_URI
      }
    });
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    
    return res.status(500).json({
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
      debug: {
        VERCEL: process.env.VERCEL,
        VERCEL_URL: process.env.VERCEL_URL,
        NODE_ENV: process.env.NODE_ENV,
        hasMongoURI: !!process.env.MONGODB_URI
      }
    });
  }
}

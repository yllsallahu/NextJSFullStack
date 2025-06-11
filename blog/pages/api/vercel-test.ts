// Test endpoint to verify Vercel deployment and database connection
import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../src/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log("🔍 Vercel deployment test starting...");
    
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      MONGODB_URI: !!process.env.MONGODB_URI,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL
    };
    
    console.log("Environment check:", envCheck);
    
    // Test MongoDB connection
    console.log("🔌 Testing MongoDB connection...");
    const client = await clientPromise();
    console.log("✅ MongoDB client created");
    
    const db = client.db("myapp");
    console.log("✅ Database reference created");
    
    // Test database ping
    const pingResult = await db.admin().ping();
    console.log("✅ Database ping successful:", pingResult);
    
    // Test getting blog count
    const blogCount = await db.collection("blogs").countDocuments();
    console.log("📊 Blog count:", blogCount);
    
    // Test getting user count
    const userCount = await db.collection("users").countDocuments();
    console.log("👥 User count:", userCount);
    
    return res.status(200).json({
      success: true,
      message: "✅ Vercel deployment test successful!",
      environment: envCheck,
      database: {
        connected: true,
        blogCount,
        userCount,
        ping: pingResult
      },
      timestamp: new Date().toISOString(),
      deployment: {
        working: true,
        message: "Your app is properly deployed and connected to database!"
      }
    });
    
  } catch (error) {
    console.error("❌ Deployment test failed:", error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        MONGODB_URI: !!process.env.MONGODB_URI,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL
      },
      troubleshooting: {
        message: "Check Vercel environment variables",
        steps: [
          "1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables",
          "2. Add NEXTAUTH_SECRET, NEXTAUTH_URL, MONGODB_URI",
          "3. Set environment to Production, Preview, Development",
          "4. Redeploy your application",
          "5. Test this endpoint again: /api/vercel-test"
        ]
      },
      timestamp: new Date().toISOString()
    });
  }
}

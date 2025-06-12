// pages/api/test-vercel-db.ts
import type { NextApiRequest, NextApiResponse } from "next";
import getClientPromise, { connectToDatabase } from "../../src/lib/mongodb-vercel-fix";

interface TestResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  debug?: any;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('🚀 Starting Vercel MongoDB connection test...');
    
    // Environment check
    const envCheck = {
      MONGODB_URI: !!process.env.MONGODB_URI,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    
    console.log('📋 Environment variables:', envCheck);
    
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({
        success: false,
        message: 'MONGODB_URI environment variable is missing',
        error: 'Environment configuration error',
        debug: envCheck,
        timestamp,
      });
    }
    
    console.log('🔌 Testing database connection...');
    
    // Test 1: Basic client connection
    const client = await getClientPromise();
    console.log('✅ MongoDB client created successfully');
    
    // Test 2: Database operations
    const { db } = await connectToDatabase();
    console.log('✅ Database reference obtained');
    
    // Test 3: Ping database
    const pingResult = await db.admin().ping();
    console.log('✅ Database ping successful:', pingResult);
    
    // Test 4: Count documents in collections
    let blogCount = 0;
    let userCount = 0;
    
    try {
      blogCount = await db.collection('blogs').countDocuments();
      userCount = await db.collection('users').countDocuments();
      console.log(`📊 Found ${blogCount} blogs and ${userCount} users`);
    } catch (countError) {
      console.log('⚠️ Could not count documents (collections may not exist yet)');
    }
    
    // Test 5: List collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('📁 Available collections:', collectionNames);
    
    return res.status(200).json({
      success: true,
      message: '🎉 All database tests passed successfully!',
      data: {
        ping: pingResult,
        blogCount,
        userCount,
        collections: collectionNames,
        environment: envCheck,
      },
      timestamp,
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    
    let errorMessage = 'Unknown error';
    let errorType = 'Unknown';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorType = error.constructor.name;
      
      // Provide specific troubleshooting for common errors
      if (error.message.includes('authentication')) {
        errorMessage = 'Database authentication failed. Check your MongoDB username and password.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Database connection timeout. Check your MongoDB Atlas network settings.';
      } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
        errorMessage = 'SSL/TLS connection error. This usually resolves itself on Vercel.';
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Database connection test failed',
      error: errorMessage,
      debug: {
        errorType,
        originalMessage: error instanceof Error ? error.message : String(error),
        environment: {
          MONGODB_URI: !!process.env.MONGODB_URI,
          VERCEL: process.env.VERCEL,
          NODE_ENV: process.env.NODE_ENV,
        },
        troubleshooting: [
          '1. Check Vercel environment variables',
          '2. Verify MongoDB Atlas network access (allow 0.0.0.0/0)',
          '3. Confirm database user has correct permissions',
          '4. Try redeploying the application',
        ],
      },
      timestamp,
    });
  }
}

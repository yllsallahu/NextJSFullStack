#!/usr/bin/env node

// Test MongoDB connection with improved SSL settings
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

const options = {
  retryWrites: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
};

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('URI:', uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'Not found');
  
  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    return;
  }

  let client;
  try {
    console.log('Attempting to connect...');
    client = new MongoClient(uri, options);
    await client.connect();
    
    console.log('✅ Successfully connected to MongoDB');
    
    // Test database operations
    const db = client.db('myapp');
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test a simple operation
    const testResult = await db.admin().ping();
    console.log('🏓 Ping result:', testResult);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n🔧 SSL/TLS Error Detected. Trying alternative connection options...');
      
      // Try with different SSL options
      const alternativeOptions = {
        ...options,
        tls: false,
        ssl: false,
      };
      
      try {
        const altClient = new MongoClient(uri, alternativeOptions);
        await altClient.connect();
        console.log('✅ Connected with alternative SSL settings');
        await altClient.close();
      } catch (altError) {
        console.error('❌ Alternative connection also failed:', altError.message);
      }
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n🔑 Authentication Error: Please check your MongoDB credentials');
    }
    
  } finally {
    if (client) {
      await client.close();
      console.log('🔒 Connection closed');
    }
  }
}

testConnection().catch(console.error);

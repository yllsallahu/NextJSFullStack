#!/usr/bin/env node

// Test script to verify MongoDB connection options work locally
const { MongoClient } = require('mongodb');

// Test different URI configurations
const testConfigurations = [
  {
    name: "SSL Disabled (Recommended for Vercel)",
    uri: "mongodb+srv://ys68687:yllimali123@clusternext.zlp4afn.mongodb.net/myapp?retryWrites=true&w=majority&ssl=false&appName=NextJSFullStackBlog",
    options: {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      tls: false,
      ssl: false,
    }
  },
  {
    name: "Standard SSL Configuration",
    uri: "mongodb+srv://ys68687:yllimali123@clusternext.zlp4afn.mongodb.net/myapp?retryWrites=true&w=majority&appName=NextJSFullStackBlog",
    options: {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      tls: true,
      tlsAllowInvalidCertificates: false,
    }
  }
];

async function testConfiguration(config) {
  console.log(`\n🧪 Testing: ${config.name}`);
  console.log(`URI: ${config.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  let client;
  try {
    client = new MongoClient(config.uri, config.options);
    await client.connect();
    
    const db = client.db('myapp');
    const pingResult = await db.admin().ping();
    
    console.log(`✅ Success! Ping result:`, pingResult);
    
    // Test basic operations
    const collections = await db.listCollections().toArray();
    console.log(`📊 Collections found: ${collections.length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log(`🔧 SSL/TLS Error - This configuration won't work on Vercel`);
    }
    return false;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

async function runTests() {
  console.log('🚀 Testing MongoDB Connection Configurations for Vercel');
  console.log('====================================================');
  
  const results = [];
  
  for (const config of testConfigurations) {
    const success = await testConfiguration(config);
    results.push({ name: config.name, success });
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  results.forEach(result => {
    const status = result.success ? '✅ WORKS' : '❌ FAILS';
    console.log(`${status} - ${result.name}`);
  });
  
  const workingConfigs = results.filter(r => r.success);
  if (workingConfigs.length > 0) {
    console.log(`\n🎯 Recommended: Use "${workingConfigs[0].name}" configuration on Vercel`);
  } else {
    console.log('\n⚠️  No configurations worked. Check your MongoDB Atlas settings:');
    console.log('   1. Network Access: Allow 0.0.0.0/0');
    console.log('   2. Database Access: Verify user credentials');
    console.log('   3. Try connecting from MongoDB Compass first');
  }
}

runTests().catch(console.error);

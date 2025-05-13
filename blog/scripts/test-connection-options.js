// Test MongoDB connection with different options
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  // Try different connection parameters
  const options = [
    { useNewUrlParser: true, useUnifiedTopology: true },
    { directConnection: true },
    { ssl: false },
    { tlsInsecure: true },
    { ssl: true, tls: true },
    {}  // Default options
  ];

  for (const option of options) {
    try {
      console.log(`\nTrying connection with options: ${JSON.stringify(option)}`);
      const uri = process.env.MONGODB_URI;
      const client = new MongoClient(uri, option);
      
      await client.connect();
      const db = client.db('myapp');
      await db.command({ ping: 1 });
      
      console.log('✅ CONNECTION SUCCESSFUL with options:', option);
      await client.close();
      return; // Exit after first successful connection
    } catch (err) {
      console.error(`❌ Connection failed with options ${JSON.stringify(option)}:`, err.message);
    }
  }
  console.log('\nAll connection attempts failed.');
}

testConnection();

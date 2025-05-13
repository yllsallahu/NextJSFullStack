const { MongoClient } = require('mongodb');

async function main() {
    try {
        // Use direct connection
        const uri = "mongodb+srv://ys68687:yllimali123@nextcluster.amzhxjd.mongodb.net/myapp?retryWrites=true&w=majority";
        const client = new MongoClient(uri, { 
            useNewUrlParser: true,
            useUnifiedTopology: true,
            directConnection: true
        });
        
        console.log('Connecting to MongoDB...');
        await client.connect();
        
        console.log('Connected successfully. Testing database access...');
        const db = client.db('myapp');
        await db.command({ ping: 1 });
        
        console.log('Database ping successful!');
        await client.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();
import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from 'lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const client = await clientPromise;
    await client.db().command({ ping: 1 });
    res.status(200).json({ 
      status: 'success',
      message: 'Successfully connected to MongoDB',
      database: client.db().databaseName
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
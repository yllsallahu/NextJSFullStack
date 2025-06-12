import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import { getToken } from 'next-auth/jwt';
import { getUserById } from 'api/services/User';
import { put } from '@vercel/blob';

// Disable the default body parser to allow formidable to parse the request
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Check if user is a superuser
  const user = await getUserById(token.id as string);
  if (!user?.isSuperUser) {
    return res.status(403).json({ error: 'Only superusers can upload images' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data - don't specify uploadDir to avoid filesystem writes
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      // Remove uploadDir to use system temp directory
    });

    const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
      form.parse(req, (err, fieldsFromCallback, filesFromCallback) => {
        if (err) return reject(err);
        resolve({ fields: fieldsFromCallback, files: filesFromCallback });
      });
    });

    // Get the uploaded file field
    const imageFileField = files.image;
    if (!imageFileField) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Handle if imageFileField is an array
    const actualFile = Array.isArray(imageFileField) ? imageFileField[0] : imageFileField;

    if (!actualFile || !actualFile.filepath) {
      return res.status(500).json({ error: 'Server file processing error: Incomplete file data.' });
    }

    // Read the file from temp location
    const fileBuffer = await fs.readFile(actualFile.filepath);
    
    // Generate filename
    const timestamp = Date.now();
    const originalName = actualFile.originalFilename || 'image';
    const extension = originalName.split('.').pop() || 'jpg';
    const filename = `${timestamp}.${extension}`;

    // Upload to Vercel Blob
    const blob = await put(filename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    return res.status(200).json({ imageUrl: blob.url });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    const message = error.message || 'Failed to upload image';
    return res.status(500).json({ error: message, code: error.code });
  }
} 
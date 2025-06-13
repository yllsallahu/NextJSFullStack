import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';
import { getUserById } from 'api/services/User';
import { put } from '@vercel/blob';

// Disable the default body parser to allow formidable to parse the request
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to check if Vercel Blob is properly configured
const isVercelBlobConfigured = () => {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  return token && token !== 'vercel_blob_rw_your_token_here' && !token.includes('placeholder');
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
    // Parse the incoming form data - use system temp directory, not custom uploadDir
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      // Don't specify uploadDir to avoid filesystem writes to public/uploads
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

    // Handle if imageFileField is an array (e.g., multiple files with same name)
    const actualFile = Array.isArray(imageFileField) ? imageFileField[0] : imageFileField;

    // Ensure actualFile is valid and has a filepath
    if (!actualFile || typeof actualFile.filepath !== 'string' || !actualFile.filepath) {
      console.error('Formidable file object error: filepath is missing or not a string. File object:', actualFile);
      return res.status(500).json({ error: 'Server file processing error: Incomplete file data.' });
    }
    
    // Read the file from the temporary location
    const fileBuffer = await fs.readFile(actualFile.filepath);
    
    // Determine the file extension
    let ext = '';
    // Prioritize newFilename as it's what formidable uses on disk and respects keepExtensions.
    if (actualFile.newFilename && typeof actualFile.newFilename === 'string') {
        ext = actualFile.newFilename.split('.').pop() || '';
    } 
    // Fallback to originalFilename if newFilename didn't yield an extension or was missing.
    else if (actualFile.originalFilename && typeof actualFile.originalFilename === 'string') {
        ext = actualFile.originalFilename.split('.').pop() || '';
    }

    const timestamp = Date.now();
    const filename = ext ? `${timestamp}.${ext}` : `${timestamp}`;
    
    // Check if Vercel Blob is configured, otherwise use local storage
    if (isVercelBlobConfigured()) {
      try {
        // Upload to Vercel Blob
        const blob = await put(filename, fileBuffer, {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return res.status(200).json({ imageUrl: blob.url });
      } catch (blobError: any) {
        console.error('Vercel Blob upload failed, falling back to local storage:', blobError);
        // Fall through to local storage
      }
    }
    
    // Fallback: Use local storage
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, fileBuffer);
    
    // Return the relative URL for the uploaded file
    const imageUrl = `/uploads/${filename}`;
    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    const message = error.message || 'Failed to upload image';
    return res.status(500).json({ error: message, code: error.code });
  }
}

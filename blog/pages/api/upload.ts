import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { getToken } from 'next-auth/jwt';
import { getUserById } from 'api/services/User';

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
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Parse the incoming form data
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
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
    
    // Determine the file extension
    let ext = '';
    // Prioritize newFilename as it's what formidable uses on disk and respects keepExtensions.
    if (actualFile.newFilename && typeof actualFile.newFilename === 'string') {
        ext = path.extname(actualFile.newFilename);
    } 
    // Fallback to originalFilename if newFilename didn't yield an extension or was missing.
    else if (actualFile.originalFilename && typeof actualFile.originalFilename === 'string') {
        ext = path.extname(actualFile.originalFilename);
    }
    // If ext is still '', the file might genuinely have no extension. path.extname('') is ''.

    const timestamp = Date.now();
    // filename will be like '1678886400000.jpg' or '1678886400000' if no ext
    const filename = `${timestamp}${ext}`; 
    
    const finalPath = path.join(uploadDir, filename);
    
    // fs.rename requires actualFile.filepath to be the correct path to the temp file
    await fs.rename(actualFile.filepath, finalPath);
    
    const imageUrl = `/uploads/${filename}`;

    return res.status(200).json({ imageUrl });
  } catch (error: any) {
    console.error('Error uploading image:', error); // Log the full error object
    const message = error.message || 'Failed to upload image';
    return res.status(500).json({ error: message, code: error.code });
  }
}

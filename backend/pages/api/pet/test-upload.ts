// File: test-upload.ts
// Description: Test endpoint to verify FormData and image upload processing

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[TEST-UPLOAD] Testing FormData processing...');
    
    // Parse multipart/form-data
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
    });
    
    const result = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
    
    const [fields, files] = result;
    
    console.log('[TEST-UPLOAD] Fields received:', fields);
    console.log('[TEST-UPLOAD] Files received:', files);
    console.log('[TEST-UPLOAD] petPicture field:', fields.petPicture);
    console.log('[TEST-UPLOAD] petPicture file:', files.petPicture);
    
    // Check if we received an image file
    if (files.petPicture && Object.keys(files.petPicture).length > 0) {
      const file = Array.isArray(files.petPicture) ? files.petPicture[0] : files.petPicture;
      console.log('[TEST-UPLOAD] Image file details:', {
        originalFilename: file.originalFilename,
        filepath: file.filepath,
        size: file.size,
        mimetype: file.mimetype
      });
      
      return res.status(200).json({
        message: 'Image file received successfully',
        filename: file.originalFilename,
        size: file.size,
        mimetype: file.mimetype
      });
    } else if (fields.petPicture) {
      return res.status(200).json({
        message: 'petPicture field received (no file)',
        value: fields.petPicture
      });
    } else {
      return res.status(200).json({
        message: 'No petPicture field or file received',
        fields: Object.keys(fields),
        files: Object.keys(files)
      });
    }
    
  } catch (error) {
    console.error('[TEST-UPLOAD] Error:', error);
    return res.status(500).json({ 
      message: 'Test failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

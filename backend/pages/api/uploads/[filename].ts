// File: [filename].ts
// Description: API endpoint to serve uploaded images

import type { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { filename } = req.query;
    
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ message: 'Filename is required' });
    }

    // Construct the file path
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Read the file
    const imageBuffer = await fs.readFile(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Send the image
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('[GET /uploads/[filename]] Error:', error);
    res.status(500).json({ message: 'Failed to serve image' });
  }
}

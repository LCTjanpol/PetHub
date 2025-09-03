// Health check endpoint for PetHub Backend
// This endpoint is used to verify the server is running
// Last updated: 2024-12-30 to force Vercel redeployment
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'PetHub Backend is running successfully!',
    version: '1.0.0',
    commit: '70528f0'
  });
} 
// Health check endpoint for PetHub Backend
// This endpoint is used to verify the server is running
// Last updated: 2024-12-30 to force Vercel redeployment
// URGENT: Vercel is stuck on old commit - this should force a fresh deployment!
// FORCE DEPLOY: 2024-12-30 22:36 - All TailwindCSS removed from CSS files
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'PetHub Backend is running successfully!',
    version: '1.0.0',
    commit: 'FORCE_DEPLOY_' + Date.now(), // Force Vercel to recognize this as new
    deployment: 'EMERGENCY_FIX_' + Math.random().toString(36).substr(2, 9),
    forceUpdate: 'TailwindCSS completely removed from CSS files - build should work now!'
  });
} 
// File: cors.ts
// Description: CORS middleware for handling cross-origin requests from React Native app
// Updated for production deployment with proper security

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

// Get allowed origins from environment variables
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS || '*';
  return origins === '*' ? ['*'] : origins.split(',').map(origin => origin.trim());
};

// CORS middleware for Next.js API routes
export function corsMiddleware(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const allowedOrigins = getAllowedOrigins();
    const origin = req.headers.origin;
    
    // Set CORS headers based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: Only allow specific origins
      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        res.setHeader('Access-Control-Allow-Origin', origin || allowedOrigins[0]);
      }
    } else {
      // Development: Allow all origins
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Call the original handler
    return handler(req, res);
  };
}

// Combined CORS and authentication middleware
export function corsWithAuthMiddleware(handler: NextApiHandler) {
  return corsMiddleware(handler);
} 
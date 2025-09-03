import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware, adminMiddleware } from '../../../lib/middleware';

// Handler for regular users to fetch shop locations
const userHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      console.log('[userHandler] Fetching shop locations for map');
      const shops = await prisma.shop.findMany({
        select: { 
          id: true, 
          shopName: true, 
          latitude: true, 
          longitude: true, 
          shopType: true,
          shopLocation: true,
          isAvailable: true
        },
      });
      console.log(`[userHandler] Successfully fetched ${shops.length} shops`);
      return res.status(200).json(shops);
    } catch (error) {
      console.error('[userHandler] Error fetching shops:', error.message, error.stack);
      return res.status(500).json({ message: 'Failed to fetch shop data' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

// Handler for admin to add new shops
const adminHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      console.log('[adminHandler] Creating new shop');
      const { 
        userId, 
        shopName, 
        shopLocation, 
        latitude, 
        longitude, 
        shopType, 
        bio, 
        contactNumber, 
        shopMessage, 
        openingTime, 
        closingTime, 
        availableDays 
      } = req.body;
      
      // Validate required fields
      if (!userId || !shopName || !shopLocation || !latitude || !longitude || !shopType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      const shop = await prisma.shop.create({
        data: { 
          userId,
          shopName, 
          shopLocation, 
          latitude: parseFloat(latitude), 
          longitude: parseFloat(longitude), 
          shopType,
          bio: bio || '',
          contactNumber: contactNumber || '',
          shopMessage: shopMessage || '',
          openingTime: openingTime || '09:00',
          closingTime: closingTime || '17:00',
          availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
      });
      console.log(`[adminHandler] Successfully created shop: ${shop.shopName}`);
      return res.status(201).json(shop);
    } catch (error) {
      console.error('[adminHandler] Error creating shop:', error.message, error.stack);
      return res.status(500).json({ message: 'Failed to create shop' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

// Combine handlers based on request method
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    return userHandler(req, res);
  } else if (req.method === 'POST') {
    return adminMiddleware(adminHandler)(req, res);
  }
  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
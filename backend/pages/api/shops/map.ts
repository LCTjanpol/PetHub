// File: map.ts
// Description: API endpoint for shop map data

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { search } = req.query;
      
      // Get all shops for map display (temporarily show all until Prisma client is regenerated)
      let shops = await prisma.shop.findMany({
        include: {
          user: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: { shopName: 'asc' },
      });

      // Filter by search term if provided
      if (search && typeof search === 'string') {
        shops = shops.filter(shop => 
          shop.shopName.toLowerCase().includes(search.toLowerCase()) ||
          shop.shopLocation.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Format response for map
      const mapShops = shops.map(shop => {
        const shopData = {
          id: shop.id,
          shopName: shop.shopName,
          shopImage: shop.shopImage,
          shopLocation: shop.shopLocation,
          latitude: shop.latitude,
          longitude: shop.longitude,
          shopType: shop.shopType,
          openingTime: shop.openingTime,
          closingTime: shop.closingTime,
          isAvailable: shop.isAvailable,
          approved: shop.approved,
          ownerName: shop.user?.fullName || 'Unknown',
        };
        return shopData;
      });

      res.status(200).json(mapShops);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Shop map error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
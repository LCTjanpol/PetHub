// File: [id].ts
// Description: API endpoint for shop profile viewing

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const shopId = parseInt(req.query.id as string);

    if (req.method === 'GET') {
      // Get shop profile
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          promotionalPosts: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      res.status(200).json({
        id: shop.id,
        shopName: shop.shopName,
        shopImage: shop.shopImage,
        bio: shop.bio,
        contactNumber: shop.contactNumber,
        shopLocation: shop.shopLocation,
        openingTime: shop.openingTime,
        closingTime: shop.closingTime,
        availableDays: shop.availableDays,
        isAvailable: shop.isAvailable,
        shopType: shop.shopType,
        ownerName: shop.user?.fullName || 'Unknown',
        promotionalPosts: shop.promotionalPosts,
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Shop profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

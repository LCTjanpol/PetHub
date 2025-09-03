// File: shop-status.ts
// Description: API endpoint to check user's shop application status

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Get user's shop application status
    const shopApplication = await prisma.shopApplication.findFirst({
      where: {
        userId,
        status: 'approved',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get user's current shop owner status
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isShopOwner: true },
    });

    // Check if user has a shop
    const shop = await prisma.shop.findUnique({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      data: {
        isShopOwner: user?.isShopOwner || false,
        hasShop: !!shop,
        shopApplication: shopApplication ? {
          id: shopApplication.id,
          status: shopApplication.status,
          shopName: shopApplication.shopName,
          createdAt: shopApplication.createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('Shop status check error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

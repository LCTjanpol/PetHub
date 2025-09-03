// File: [id].ts
// Description: Admin API endpoint for managing individual shops

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { adminMiddleware } from '../../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Shop ID is required' });
  }

  if (req.method === 'DELETE') {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: parseInt(id) },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              isShopOwner: true,
            },
          },
        },
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Use transaction to ensure all related data is deleted
      await prisma.$transaction(async (tx) => {
        // Delete all promotional posts
        await tx.promotionalPost.deleteMany({
          where: { shopId: parseInt(id) }
        });

        // Update user to no longer be shop owner
        await tx.user.update({
          where: { id: shop.userId },
          data: { isShopOwner: false }
        });

        // Delete shop and related data
        await tx.shop.delete({
          where: { id: parseInt(id) },
        });
      });

      return res.status(200).json({ message: 'Shop and all related data deleted successfully' });
    } catch (error) {
      console.error('Error deleting shop:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);

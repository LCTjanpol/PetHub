// File: shop-applications.ts
// Description: Admin API endpoint for managing shop applications

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminMiddleware } from '../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      // Get all shop applications with user details
      const applications = await prisma.shopApplication.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(applications);
    } catch (error) {
      console.error('Error fetching shop applications:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);

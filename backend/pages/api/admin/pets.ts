import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { adminMiddleware } from '../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      console.log('[adminHandler] Fetching all pets with user information');
      // Return all pets in the system for admin with user information
      const pets = await prisma.pet.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            }
          },
          medicalRecords: true,
          tasks: true,
        },
        orderBy: {
          createdAt: 'desc',
        }
      });
      
      console.log(`[adminHandler] Successfully fetched ${pets.length} pets`);
      return res.status(200).json(pets);
    } catch (error) {
      console.error('[adminHandler] Error fetching pets:', error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error.stack : '');
      return res.status(500).json({ message: 'Failed to fetch pets data' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);
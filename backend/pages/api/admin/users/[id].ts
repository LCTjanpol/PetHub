// File: [id].ts
// Description: Admin API endpoint for managing individual users

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { adminMiddleware } from '../../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (req.method === 'DELETE') {
    try {
      const userId = parseInt(id);
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          pets: true,
          shop: true,
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prevent deletion of admin users
      if (user.isAdmin) {
        return res.status(403).json({ message: 'Cannot delete admin users' });
      }

      // Use transaction to ensure all related data is deleted
      await prisma.$transaction(async (tx) => {
        // Delete all related data in correct order
        
        // Delete vaccination records for user's pets
        if (user.pets.length > 0) {
          await tx.vaccinationRecord.deleteMany({
            where: { userId: userId }
          });
        }

        // Delete medical records for user's pets
        if (user.pets.length > 0) {
          await tx.medicalRecord.deleteMany({
            where: { userId: userId }
          });
        }

        // Delete tasks for user's pets
        await tx.task.deleteMany({
          where: { userId: userId }
        });

        // Delete post likes
        await tx.postLike.deleteMany({
          where: { userId: userId }
        });

        // Delete replies
        await tx.reply.deleteMany({
          where: { userId: userId }
        });

        // Delete comments
        await tx.comment.deleteMany({
          where: { userId: userId }
        });

        // Delete shop and related data
        if (user.shop) {
          await tx.promotionalPost.deleteMany({
            where: { shopId: user.shop.id }
          });
          await tx.shop.delete({
            where: { id: user.shop.id }
          });
        }

        // Delete shop applications
        await tx.shopApplication.deleteMany({
          where: { userId: userId }
        });

        // Delete pets (this will cascade to pet-related data)
        await tx.pet.deleteMany({
          where: { userId: userId }
        });

        // Delete posts
        await tx.post.deleteMany({
          where: { userId: userId }
        });

        // Finally delete the user
        await tx.user.delete({
          where: { id: userId }
        });
      });

      return res.status(200).json({ message: 'User and all related data deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);

// File: like.ts
// Description: API endpoint for post likes management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../../../lib/middleware';

const prisma = new PrismaClient();

interface AuthedRequest extends NextApiRequest {
  user?: { userId: number };
}

const handler = async (req: AuthedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;
  const postId = parseInt(req.query.id as string);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      console.log(`Like request - userId: ${userId}, postId: ${postId}`);
      
      // Toggle like on post
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      console.log('Existing like:', existingLike);

      if (existingLike) {
        // Unlike
        await prisma.postLike.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });

        console.log('Post unliked successfully');
        res.status(200).json({
          success: true,
          message: 'Post unliked successfully',
          liked: false,
        });
      } else {
        // Like
        await prisma.postLike.create({
          data: {
            userId,
            postId,
          },
        });

        console.log('Post liked successfully');
        res.status(201).json({
          success: true,
          message: 'Post liked successfully',
          liked: true,
        });
      }
    } catch (error) {
      console.error('Post like error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
};

export default authMiddleware(handler); 
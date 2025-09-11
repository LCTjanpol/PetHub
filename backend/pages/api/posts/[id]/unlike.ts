// File: unlike.ts
// Description: API endpoint for post unlike functionality

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;
    const postId = parseInt(req.query.id as string);

    if (req.method === 'POST') {
      // Remove like from post
      const existingLike = await prisma.postLike.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });

      if (existingLike) {
        await prisma.postLike.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });

        res.status(200).json({
          success: true,
          message: 'Post unliked successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Post was not liked',
        });
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

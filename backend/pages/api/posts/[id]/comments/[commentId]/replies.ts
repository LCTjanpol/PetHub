// File: replies.ts
// Description: API endpoint for comment replies management

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const commentId = parseInt(req.query.commentId as string);

    if (req.method === 'POST') {
      // Add reply to comment
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Reply content is required' });
      }

      // Check if comment exists
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ message: 'Comment not found' });
      }

      // Create reply
      const reply = await prisma.reply.create({
        data: {
          userId,
          commentId,
          content: content.trim(),
        },
        include: {
          user: {
            select: {
              fullName: true,
              profilePicture: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        message: 'Reply added successfully',
        data: reply,
      });
    } else if (req.method === 'GET') {
      // Get replies for comment
      const replies = await prisma.reply.findMany({
        where: { commentId },
        include: {
          user: {
            select: {
              fullName: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      res.status(200).json(replies);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Replies error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
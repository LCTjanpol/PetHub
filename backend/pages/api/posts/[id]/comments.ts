// File: comments.ts
// Description: API endpoint for post comments management

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
    const postId = parseInt(req.query.id as string);

    if (req.method === 'POST') {
      // Add comment to post
      const { content } = req.body;

      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Comment content is required' });
      }

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Create comment
      const comment = await prisma.comment.create({
        data: {
          userId,
          postId,
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
        message: 'Comment added successfully',
        data: comment,
      });
    } else if (req.method === 'GET') {
      // Get comments for post
      const comments = await prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              fullName: true,
              profilePicture: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  fullName: true,
                  profilePicture: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(comments);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
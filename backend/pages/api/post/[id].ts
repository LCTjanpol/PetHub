// File: post/[id].ts
// Description: API endpoint for deleting individual posts

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';

interface AuthedRequest extends NextApiRequest {
  user?: { userId: number };
}

const handler = async (req: AuthedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;
  const postId = req.query.id as string;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'DELETE') {
    try {
      // Check if post exists and belongs to the user
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) },
        select: { userId: true },
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (post.userId !== userId) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own posts' });
      }

      // Delete the post (this will cascade delete comments, replies, and likes)
      await prisma.post.delete({
        where: { id: parseInt(postId) },
      });

      return res.status(204).json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('DELETE /api/post/[id] error:', error);
      return res.status(500).json({ message: 'Failed to delete post', error });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
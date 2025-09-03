import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable the default body parser
  },
};

interface AuthedRequest extends NextApiRequest {
  user?: { userId: number };
}

const handler = async (req: AuthedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;

  if (req.method === 'POST') {
    try {
      // Parse multipart/form-data
      const form = formidable({
        multiples: false,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024 // 5MB limit
      });
      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: userId missing' });
      }

      // Extract content from form data
      const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Post content is required' });
      }

      // Check if user is a shop owner
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isShopOwner: true },
      });

      // Create the post
      const post = await prisma.post.create({
        data: { 
          userId, 
          content: content.trim(),
        },
        include: { 
          user: { 
            select: { 
              fullName: true, 
              profilePicture: true, 
              id: true,
              isShopOwner: true,
            } 
          } 
        },
      });

      return res.status(201).json({
        success: true,
        data: post,
      });
    } catch (error) {
      console.error('POST /api/post error:', error);
      return res.status(500).json({ message: 'Failed to create post', error });
    }
  }

  if (req.method === 'GET') {
    const posts = await prisma.post.findMany({
      include: { 
        user: { 
          select: { 
            fullName: true, 
            profilePicture: true, 
            id: true,
            isShopOwner: true,
          } 
        },
        comments: {
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
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        postLikes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add isLiked field for each post
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: post.postLikes.some(like => like.userId === userId),
      likesCount: post.postLikes.length,
      commentsCount: post.comments.length,
    }));

    console.log('Posts with likes:', postsWithLikes.map(p => ({ id: p.id, likesCount: p.likesCount, isLiked: p.isLiked })));
    return res.status(200).json(postsWithLikes);
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
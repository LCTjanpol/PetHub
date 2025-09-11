// File: posts.ts
// Description: API endpoint for posts listing with pagination and filtering

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Optional authentication for posts listing
      let userId: number | null = null;
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
          userId = decoded.userId;
        } catch (error) {
          // If token is invalid, just continue without userId (public posts)
          console.log('Invalid token for posts listing, continuing without auth');
        }
      }

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Fetch posts with user information and engagement data
      const posts = await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profilePicture: true,
              isShopOwner: true,
            },
          },
          comments: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  profilePicture: true,
                },
              },
              replies: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      profilePicture: true,
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          postLikes: userId ? {
            where: { userId },
            select: { id: true },
          } : false,
          _count: {
            select: {
              postLikes: true,
              comments: true,
            },
          },
        },
      });

      // Transform posts to include like status and counts
      const transformedPosts = posts.map(post => ({
        id: post.id,
        userId: post.userId,
        userName: post.user.fullName,
        userProfilePicture: post.user.profilePicture,
        content: post.content,
        image: post.image,
        createdAt: post.createdAt,
        likes: post._count.postLikes,
        likesCount: post._count.postLikes,
        commentsCount: post._count.comments,
        isLiked: userId ? (post.postLikes && post.postLikes.length > 0) : false,
        isShopOwner: post.user.isShopOwner,
        user: {
          id: post.user.id,
          fullName: post.user.fullName,
          profilePicture: post.user.profilePicture,
          isShopOwner: post.user.isShopOwner,
        },
        comments: post.comments.map(comment => ({
          id: comment.id,
          userId: comment.userId,
          userName: comment.user.fullName,
          userProfilePicture: comment.user.profilePicture,
          content: comment.content,
          createdAt: comment.createdAt,
          replies: comment.replies.map(reply => ({
            id: reply.id,
            userId: reply.userId,
            userName: reply.user.fullName,
            userProfilePicture: reply.user.profilePicture,
            content: reply.content,
            createdAt: reply.createdAt,
          })),
        })),
      }));

      // Get total count for pagination
      const totalPosts = await prisma.post.count();
      const totalPages = Math.ceil(totalPosts / limit);

      res.status(200).json({
        success: true,
        data: transformedPosts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error('Posts listing error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error : undefined,
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

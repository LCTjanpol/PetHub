import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import prisma from '../../../lib/prisma';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Verify JWT token authentication
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      let userId: number;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        userId = decoded.userId;
      } catch (error) {
        return res.status(401).json({ message: 'Invalid authentication token' });
      }

      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        uploadDir: './public/uploads',
        keepExtensions: true,
        multiples: false,
      });
      
      // Ensure uploads directory exists
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err: Error | null, fields: formidable.Fields, files: formidable.Files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });


      // Extract content from form data
      const content = Array.isArray(fields.content) ? fields.content[0] : fields.content;
      
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Post content is required' });
      }

      // Handle image upload if present
      let imagePath = null;
      if (files.image) {
        const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
        if (imageFile && imageFile.filepath) {
          // Generate unique filename
          const ext = path.extname(imageFile.originalFilename || '.jpg');
          const filename = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}${ext}`;
          const newPath = path.join(uploadDir, filename);
          
          // Move file to final location
          fs.renameSync(imageFile.filepath, newPath);
          imagePath = `/uploads/${filename}`;
        }
      }

      // Create the post with optional image
      const post = await prisma.post.create({
        data: { 
          userId, 
          content: content.trim(),
          image: imagePath,
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
    // Optional authentication for GET requests
    let userId: number | null = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
        userId = decoded.userId;
      } catch (error) {
        // Invalid token, but continue without userId for public posts
      }
    }

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
      orderBy: { createdAt: 'desc' },
    });

    // Add isLiked field and counts for each post
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: userId ? (post.postLikes && post.postLikes.length > 0) : false,
      likesCount: post._count.postLikes,
      commentsCount: post._count.comments,
    }));

    return res.status(200).json(postsWithLikes);
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default handler;
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const userId = req.headers['user-id'] as string;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: userId missing' });
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

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: userId missing' });
      }

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
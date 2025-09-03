// File: promotional-post.ts
// Description: API endpoint for promotional posts management

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify authentication
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    if (req.method === 'POST') {
      // Create promotional post
      const form = formidable({
        uploadDir: path.join(process.cwd(), 'public/uploads'),
        keepExtensions: true,
        maxFileSize: 15 * 1024 * 1024, // 15MB
      });

      const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });

      const caption = fields.caption as string;

      if (!caption || caption.trim() === '') {
        return res.status(400).json({ message: 'Caption is required' });
      }

      // Check if user is a shop owner
      const shop = await prisma.shop.findUnique({
        where: { userId },
      });

      if (!shop) {
        return res.status(403).json({ message: 'Only shop owners can create promotional posts' });
      }

      // Handle image upload
      let imagePath = null;
      if (files.image && Array.isArray(files.image) && files.image.length > 0) {
        const file = files.image[0];
        if (file.filepath) {
          const fileName = `promo_${Date.now()}_${file.originalFilename || 'image.jpg'}`;
          const newPath = path.join(process.cwd(), 'public/uploads', fileName);
          
          // Move file to uploads directory
          fs.renameSync(file.filepath, newPath);
          imagePath = `/uploads/${fileName}`;
        }
      }

      // Create promotional post
      const promotionalPost = await prisma.promotionalPost.create({
        data: {
          shopId: shop.id,
          caption: caption.trim(),
          image: imagePath,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Promotional post created successfully',
        data: promotionalPost,
      });
    } else if (req.method === 'GET') {
      // Get promotional posts for shop
      const shop = await prisma.shop.findUnique({
        where: { userId },
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const promotionalPosts = await prisma.promotionalPost.findMany({
        where: { shopId: shop.id },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json(promotionalPosts);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Promotional post error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
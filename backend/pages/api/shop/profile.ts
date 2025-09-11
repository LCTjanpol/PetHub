// File: profile.ts
// Description: API endpoint for shop profile management

import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import jwt from 'jsonwebtoken';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = decoded.userId;

    if (req.method === 'GET') {
      // Get shop profile
      const shop = await prisma.shop.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      });

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      const shopData = {
        id: shop.id,
        shopName: shop.shopName,
        shopImage: shop.shopImage,
        bio: shop.bio,
        contactNumber: shop.contactNumber,
        shopLocation: shop.shopLocation,
        openingTime: shop.openingTime,
        closingTime: shop.closingTime,
        availableDays: shop.availableDays,
        isAvailable: shop.isAvailable,
        shopType: shop.shopType,
        user: shop.user,
      };

      res.status(200).json({
        success: true,
        message: 'Shop profile retrieved successfully',
        data: shopData,
      });
    } else if (req.method === 'PUT') {
      // Update shop profile
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

      const shopName = fields.shopName as string;
      const bio = fields.bio as string;
      const contactNumber = fields.contactNumber as string;
      const shopLocation = fields.shopLocation as string;
      const isAvailable = fields.isAvailable === 'true';

      // Validate required fields - make them optional for editing
      if (!shopName) {
        return res.status(400).json({ message: 'Shop name is required' });
      }

      // Handle image upload
      let shopImagePath = undefined;
      if (files.shopImage) {
        const file = files.shopImage as formidable.File;
        if (file.filepath) {
          const fileName = `shop_${Date.now()}_${file.originalFilename || 'image.jpg'}`;
          const newPath = path.join(process.cwd(), 'public/uploads', fileName);
          
          // Move file to uploads directory
          fs.renameSync(file.filepath, newPath);
          shopImagePath = `/uploads/${fileName}`;
        }
      }

      // Update shop - only update fields that are provided
      const updateData: Record<string, string | boolean> = {
        shopName,
        isAvailable,
        ...(shopImagePath && { shopImage: shopImagePath }),
      };

      // Only update fields that have values
      if (bio && bio.trim()) updateData.bio = bio;
      if (contactNumber && contactNumber.trim()) updateData.contactNumber = contactNumber;
      if (shopLocation && shopLocation.trim()) updateData.shopLocation = shopLocation;

      const updatedShop = await prisma.shop.update({
        where: { userId },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        message: 'Shop profile updated successfully',
        data: updatedShop,
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Shop profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
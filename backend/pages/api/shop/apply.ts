// File: apply.ts
// Description: API endpoint for shop owner applications

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

    // Parse form data
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

    // Extract form data with proper array handling
    const shopName = Array.isArray(fields.shopName) ? fields.shopName[0] : fields.shopName as string;
    const shopLocation = Array.isArray(fields.shopLocation) ? fields.shopLocation[0] : fields.shopLocation as string;
    const bio = Array.isArray(fields.bio) ? fields.bio[0] : fields.bio as string;
    const contactNumber = Array.isArray(fields.contactNumber) ? fields.contactNumber[0] : fields.contactNumber as string;
    const shopMessage = Array.isArray(fields.shopMessage) ? fields.shopMessage[0] : fields.shopMessage as string;
    const shopType = Array.isArray(fields.shopType) ? fields.shopType[0] : fields.shopType as string;
    const openingTime = Array.isArray(fields.openingTime) ? fields.openingTime[0] : fields.openingTime as string;
    const closingTime = Array.isArray(fields.closingTime) ? fields.closingTime[0] : fields.closingTime as string;
    const availableDays = Array.isArray(fields.availableDays) ? fields.availableDays[0] : fields.availableDays as string;
    const isAvailable = Array.isArray(fields.isAvailable) ? fields.isAvailable[0] === 'true' : fields.isAvailable === 'true';
    
    // Extract coordinates for map pinning
    const latitude = Array.isArray(fields.latitude) ? parseFloat(fields.latitude[0]) : parseFloat(fields.latitude as string || '0');
    const longitude = Array.isArray(fields.longitude) ? parseFloat(fields.longitude[0]) : parseFloat(fields.longitude as string || '0');

    // Parse available days JSON
    let parsedAvailableDays: string[] = [];
    try {
      parsedAvailableDays = JSON.parse(availableDays);
    } catch (error) {
      console.error('Error parsing available days:', error);
      return res.status(400).json({ message: 'Invalid available days format' });
    }

    // Validate required fields
    if (!shopName || !shopLocation || !bio || !contactNumber || !shopMessage || !shopType || !openingTime || !closingTime || parsedAvailableDays.length === 0) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Handle image upload with proper error handling
    let shopImagePath = null;
    if (files.shopImage) {
      try {
        // Handle both single file and array of files
        const fileArray = Array.isArray(files.shopImage) ? files.shopImage : [files.shopImage];
        const file = fileArray[0] as formidable.File;
        
        if (file && file.filepath) {
          const fileName = `shop_${Date.now()}_${file.originalFilename || 'image.jpg'}`;
          const newPath = path.join(process.cwd(), 'public/uploads', fileName);
          
          // Ensure uploads directory exists
          const uploadsDir = path.join(process.cwd(), 'public/uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Move file to uploads directory
          fs.renameSync(file.filepath, newPath);
          shopImagePath = `/uploads/${fileName}`;
        } else {
          console.error('File upload error: Invalid file structure', file);
          return res.status(400).json({ message: 'Invalid file upload' });
        }
      } catch (fileError) {
        console.error('File upload error:', fileError);
        return res.status(400).json({ message: 'Failed to process uploaded file' });
      }
    }

    // Check if user already has a pending application
    const existingApplication = await prisma.shopApplication.findFirst({
      where: {
        userId,
        status: 'pending',
      },
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending shop application' });
    }

    // Create shop application with coordinates
    const shopApplication = await prisma.shopApplication.create({
      data: {
        userId,
        shopName,
        shopImage: shopImagePath,
        shopLocation,
        bio,
        contactNumber,
        shopMessage,
        shopType,
        openingTime,
        closingTime,
        availableDays: parsedAvailableDays,
        isAvailable,
        status: 'pending',
        // Add coordinates for map pinning
        latitude: latitude || 0,
        longitude: longitude || 0,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Shop application submitted successfully',
      data: shopApplication,
    });
  } catch (error) {
    console.error('Shop application error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
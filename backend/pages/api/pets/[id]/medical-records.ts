// File: medical-records.ts
// Description: API endpoint for pet medical records management

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
    const petId = parseInt(req.query.id as string);

    if (req.method === 'POST') {
      // Create medical record
      const { type, medicineName, veterinarian, clinic, date } = req.body;

      // Validate required fields
      if (!type || !medicineName || !veterinarian || !clinic || !date) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Check if pet belongs to user
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          userId,
        },
      });

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Create medical record
      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          userId,
          petId,
          type,
          medicineName,
          veterinarian,
          clinic,
          date: new Date(date),
        },
      });

      res.status(201).json({
        success: true,
        message: 'Medical record added successfully',
        data: medicalRecord,
      });
    } else if (req.method === 'GET') {
      // Get medical records for pet
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          userId,
        },
        include: {
          medicalRecords: {
            orderBy: { date: 'desc' },
          },
        },
      });

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      res.status(200).json(pet.medicalRecords);
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Medical records error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 
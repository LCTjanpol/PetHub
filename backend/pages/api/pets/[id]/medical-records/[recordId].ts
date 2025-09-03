// File: [recordId].ts
// Description: API endpoint for individual medical record operations

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
    const recordId = parseInt(req.query.recordId as string);

    if (req.method === 'GET') {
      // Get specific medical record
      const medicalRecord = await prisma.medicalRecord.findFirst({
        where: {
          id: recordId,
          petId,
          userId,
        },
      });

      if (!medicalRecord) {
        return res.status(404).json({ message: 'Medical record not found' });
      }

      res.status(200).json(medicalRecord);
    } else if (req.method === 'PUT') {
      // Update medical record
      const { type, medicineName, veterinarian, clinic, date } = req.body;

      // Validate required fields
      if (!type || !medicineName || !veterinarian || !clinic || !date) {
        return res.status(400).json({ message: 'All required fields must be provided' });
      }

      // Check if record exists and belongs to user
      const existingRecord = await prisma.medicalRecord.findFirst({
        where: {
          id: recordId,
          petId,
          userId,
        },
      });

      if (!existingRecord) {
        return res.status(404).json({ message: 'Medical record not found' });
      }

      // Update medical record
      const updatedRecord = await prisma.medicalRecord.update({
        where: { id: recordId },
        data: {
          type,
          medicineName,
          veterinarian,
          clinic,
          date: new Date(date),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Medical record updated successfully',
        data: updatedRecord,
      });
    } else if (req.method === 'DELETE') {
      // Delete medical record
      const existingRecord = await prisma.medicalRecord.findFirst({
        where: {
          id: recordId,
          petId,
          userId,
        },
      });

      if (!existingRecord) {
        return res.status(404).json({ message: 'Medical record not found' });
      }

      await prisma.medicalRecord.delete({
        where: { id: recordId },
      });

      res.status(200).json({
        success: true,
        message: 'Medical record deleted successfully',
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Medical record operation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

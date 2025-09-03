// File: [id].ts
// Description: Admin API endpoint for managing individual pets

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../lib/prisma';
import { adminMiddleware } from '../../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Pet ID is required' });
  }

  if (req.method === 'DELETE') {
    try {
      const petId = parseInt(id);
      
      // Check if pet exists
      const pet = await prisma.pet.findUnique({
        where: { id: petId },
      });

      if (!pet) {
        return res.status(404).json({ message: 'Pet not found' });
      }

      // Use transaction to ensure all related data is deleted
      await prisma.$transaction(async (tx) => {
        // Delete vaccination records
        await tx.vaccinationRecord.deleteMany({
          where: { petId: petId }
        });

        // Delete medical records
        await tx.medicalRecord.deleteMany({
          where: { petId: petId }
        });

        // Delete tasks
        await tx.task.deleteMany({
          where: { petId: petId }
        });

        // Delete the pet
        await tx.pet.delete({
          where: { id: petId }
        });
      });

      return res.status(200).json({ message: 'Pet and all related data deleted successfully' });
    } catch (error) {
      console.error('Error deleting pet:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);

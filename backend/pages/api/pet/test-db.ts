// File: test-db.ts
// Description: Test endpoint to check database contents directly

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('[TEST-DB] Checking database contents...');
    
    // Get all pets with their picture fields
    const pets = await prisma.pet.findMany({
      select: {
        id: true,
        name: true,
        petPicture: true,
        type: true,
        userId: true
      }
    });
    
    console.log('[TEST-DB] Found pets:', pets);
    
    // Get the first pet to see its structure
    if (pets.length > 0) {
      const firstPet = await prisma.pet.findFirst({
        where: { id: pets[0].id }
      });
      console.log('[TEST-DB] First pet full data:', firstPet);
    }
    
    return res.status(200).json({
      message: 'Database check completed',
      totalPets: pets.length,
      pets: pets
    });
    
  } catch (error) {
    console.error('[TEST-DB] Error:', error);
    return res.status(500).json({ 
      message: 'Database check failed', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

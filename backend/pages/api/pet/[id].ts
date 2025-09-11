import type { NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';
import type { AuthenticatedRequest } from '../../../types/next';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;
  const petId = parseInt(req.query.id as string);

  if (req.method === 'PUT') {
    try {
      console.log('[PUT /pet/[id]] Updating pet with ID:', petId);
      console.log('[PUT /pet/[id]] User ID:', userId);
      
      // Parse multipart/form-data
      const form = formidable({
        multiples: false,
        keepExtensions: true,
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
      });
      
      // Fix: Add type annotation for Promise and destructure result
      const result = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      });
      
      const [fields, files] = result;
      console.log('[PUT /pet/[id]] Received fields:', Object.keys(fields));
      console.log('[PUT /pet/[id]] Received files:', Object.keys(files));
      
      // DEBUG: Log detailed field and file contents
      console.log('[PUT /pet/[id]] Fields content:', fields);
      console.log('[PUT /pet/[id]] Files content:', files);
      console.log('[PUT /pet/[id]] petPicture field:', fields.petPicture);
      console.log('[PUT /pet/[id]] petPicture file:', files.petPicture);
      
      // Safely extract fields as strings
      const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
      const birthdate = Array.isArray(fields.birthdate) ? fields.birthdate[0] : fields.birthdate;
      const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
      const breed = Array.isArray(fields.breed) ? fields.breed[0] : fields.breed;
      const healthCondition = Array.isArray(fields.healthCondition) ? fields.healthCondition[0] : fields.healthCondition;
      
      console.log('[PUT /pet/[id]] Extracted field values:', {
        name, birthdate, type, breed, healthCondition
      });
      
      // Validate required fields
      if (!name || !type || !birthdate) {
        return res.status(400).json({ 
          message: 'Missing required fields: name, type, and birthdate are required' 
        });
      }
      
      // Check if pet exists and belongs to user
      const existingPet = await prisma.pet.findFirst({
        where: { id: petId, userId },
      });
      
      if (!existingPet) {
        return res.status(404).json({ message: 'Pet not found or does not belong to user' });
      }
      
      // Handle image updates - simplified like user profile update
      let petPicture = undefined;
      if (files.petPicture) {
        const file = Array.isArray(files.petPicture) ? files.petPicture[0] : files.petPicture;
        if (file && file.originalFilename) {
          const fileExtension = path.extname(file.originalFilename);
          const fileName = `pet_${userId}_${petId}_${Date.now()}${fileExtension}`;
          const uploadDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadDir, { recursive: true });
          const targetPath = path.join(uploadDir, fileName);
          await fs.copyFile(file.filepath, targetPath);
          petPicture = `/uploads/${fileName}`;
          console.log('[PUT /pet/[id]] ✅ New image uploaded successfully:', fileName);
        }
      }
    // Only update fields that are present - like user profile update
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (birthdate) data.birthdate = birthdate;
    if (type) data.type = type;
    if (breed) data.breed = breed;
    if (healthCondition) data.healthCondition = healthCondition;
    if (petPicture) data.petPicture = petPicture;
    
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update.' });
    }
    
    console.log('[PUT /pet/[id]] Data to update:', data);
      
      try {
        const pet = await prisma.pet.update({
          where: { id: petId, userId },
          data,
        });
        
        console.log('[PUT /pet/[id]] Pet updated successfully:', pet.id);
        return res.status(200).json(pet);
      } catch (prismaError) {
        console.error('[PUT /pet/[id]] Prisma update error:', prismaError);
        
        if (prismaError && typeof prismaError === 'object' && 'code' in prismaError && prismaError.code === 'P2002') {
          return res.status(400).json({ message: 'Pet with this name already exists for this user' });
        } else if (prismaError && typeof prismaError === 'object' && 'code' in prismaError && prismaError.code === 'P2025') {
          return res.status(404).json({ message: 'Pet not found' });
        } else {
          return res.status(500).json({ 
            message: 'Database error while updating pet', 
            error: prismaError instanceof Error ? prismaError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('[PUT /pet/[id]] Error updating pet:', error);
      return res.status(500).json({ 
        message: 'Failed to update pet', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Delete related tasks
      await prisma.task.deleteMany({ where: { petId } });
      // Delete related vaccination records
      await prisma.vaccinationRecord.deleteMany({ where: { petId } });
      // Now delete the pet
      await prisma.pet.delete({ where: { id: petId, userId } });
      return res.status(204).json({ message: 'Pet deleted' });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2003'
      ) {
        return res.status(400).json({ message: 'Cannot delete pet: related records exist.' });
      }
      return res.status(500).json({ message: 'Failed to delete pet', error });
    }
  }

  if (req.method === 'GET') {
    try {
      console.log('[GET /pet/[id]] Fetching pet with ID:', petId, 'for user:', userId);
      
      const pet = await prisma.pet.findFirst({
        where: { id: petId, userId },
      });
      
      if (!pet) {
        console.log('[GET /pet/[id]] Pet not found');
        return res.status(404).json({ message: 'Pet not found' });
      }
      
      console.log('[GET /pet/[id]] Pet found:', {
        id: pet.id,
        name: pet.name,
        petPicture: pet.petPicture,
        type: pet.type,
        birthdate: pet.birthdate
      });
      
      return res.status(200).json(pet);
    } catch (error) {
      console.error('[GET /pet/[id]] Error fetching pet:', error);
      return res.status(500).json({ message: 'Error fetching pet', error });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
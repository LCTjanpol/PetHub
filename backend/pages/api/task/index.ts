import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '../../../types/next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;

  if (req.method === 'POST') {
    let { petId } = req.body;
    const { name, description, time, frequency, isDaily } = req.body;
    
    if (typeof petId === 'string') petId = parseInt(petId, 10);
    if (typeof petId !== 'number' || isNaN(petId)) {
      return res.status(400).json({ message: 'Invalid petId' });
    }
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Task name is required' });
    }
    
    if (!time) {
      return res.status(400).json({ message: 'Task time is required' });
    }
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      const task = await prisma.task.create({
        data: {
          userId,
          petId,
          type: isDaily ? 'Daily' : 'Scheduled',
          description: description || '',
          name: name.trim(),
          time: new Date(time),
          frequency: frequency || 'daily',
        },
      });
      return res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      return res.status(500).json({ message: 'Failed to create task' });
    }
  }

  if (req.method === 'GET') {
    const petId = req.query.petId ? parseInt(req.query.petId as string) : undefined;
    const where: Record<string, unknown> = { userId };
    if (petId) where.petId = petId;
    
    try {
      const tasks = await prisma.task.findMany({
        where,
        orderBy: { time: 'asc' },
        include: {
          pet: {
            select: {
              name: true,
              type: true,
            }
          }
        }
      });
      return res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return res.status(500).json({ message: 'Failed to fetch tasks' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
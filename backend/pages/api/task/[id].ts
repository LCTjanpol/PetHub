import type { NextApiResponse } from 'next';
import type { AuthenticatedRequest } from '../../../types/next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;
  const taskId = parseInt(req.query.id as string);
  const allowedTypes = ['Feeding', 'Pooping', 'Drinking', 'Minor'];

  if (req.method === 'PUT') {
    let { petId } = req.body;
    const { type, description, time, frequency, name } = req.body;
    if (typeof petId === 'string') petId = parseInt(petId, 10);
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ message: `Task type must be one of: ${allowedTypes.join(', ')}` });
    }
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (type !== 'Minor') {
      // Only one Feeding/Pooping/Drinking per pet, update description to 'Crucial'
      const existing = await prisma.task.findFirst({ where: { userId, petId, type } });
      if (existing && existing.id !== taskId) {
        return res.status(400).json({ message: `A ${type} task already exists for this pet.` });
      }
      const task = await prisma.task.update({
        where: { id: taskId, userId },
        data: { petId, type, description: 'Crucial', time: new Date(time), frequency },
      });
      return res.status(200).json(task);
    } else {
      // Minor task: allow multiple, description is the name/description
      const taskDescription = description || name;
      if (!taskDescription) {
        return res.status(400).json({ message: 'Task description or name is required for Minor tasks' });
      }
      const task = await prisma.task.update({
        where: { id: taskId, userId },
        data: { petId, type, description: taskDescription, time: new Date(time), frequency },
      });
      return res.status(200).json(task);
    }
  }

  if (req.method === 'DELETE') {
    await prisma.task.delete({
      where: { id: taskId, userId },
    });
    return res.status(204).json({ message: 'Task deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
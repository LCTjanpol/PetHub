import type { NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';
import type { AuthenticatedRequest } from '../../../types/next';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;

  if (req.method === 'POST') {
    const { petId, vaccineName, date, expirationDate } = req.body;
    const record = await prisma.vaccinationRecord.create({
      data: {
        userId,
        petId,
        vaccineName,
        date: new Date(date),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    });
    return res.status(201).json(record);
  }

  if (req.method === 'GET') {
    const records = await prisma.vaccinationRecord.findMany({
      where: { userId },
    });
    return res.status(200).json(records);
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { authMiddleware } from '../../../lib/middleware';
import type { AuthenticatedRequest } from '../../../types/next';

const handler = async (req: AuthenticatedRequest, res: NextApiResponse) => {
  const userId = req.user?.userId;
  const recordId = parseInt(req.query.id as string);

  if (req.method === 'PUT') {
    const { petId, vaccineName, date, expirationDate } = req.body;
    const record = await prisma.vaccinationRecord.update({
      where: { id: recordId, userId },
      data: {
        petId,
        vaccineName,
        date: new Date(date),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
      },
    });
    return res.status(200).json(record);
  }

  if (req.method === 'DELETE') {
    await prisma.vaccinationRecord.delete({
      where: { id: recordId, userId },
    });
    return res.status(204).json({ message: 'Vaccination record deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default authMiddleware(handler);
// File: [action].ts
// Description: Admin API endpoint for approving/rejecting shop applications

import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../../../lib/prisma';
import { adminMiddleware } from '../../../../../lib/middleware';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'PUT') {
    try {
      const { id, action } = req.query;
      
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ message: 'Application ID is required' });
      }

      if (!action || typeof action !== 'string' || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Valid action (approve/reject) is required' });
      }

      // Convert string ID to integer
      const applicationId = parseInt(id, 10);
      
      if (isNaN(applicationId)) {
        return res.status(400).json({ message: 'Invalid application ID' });
      }

      // Find the application
      const application = await prisma.shopApplication.findUnique({
        where: { id: applicationId },
        include: { user: true },
      });

      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      if (application.status !== 'pending') {
        return res.status(400).json({ message: 'Application has already been processed' });
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected';

      // Update application status
      const updatedApplication = await prisma.shopApplication.update({
        where: { id: applicationId },
        data: { status: newStatus },
        include: { user: true },
      });

      // If approved, create shop and update user
      if (action === 'approve') {
        // Create shop with coordinates for map pinning
        const shop = await prisma.shop.create({
          data: {
            userId: application.userId,
            shopName: application.shopName,
            shopImage: application.shopImage,
            shopLocation: application.shopLocation,
            latitude: application.latitude,
            longitude: application.longitude,
            bio: application.bio,
            contactNumber: application.contactNumber,
            shopMessage: application.shopMessage, // Fixed field name
            shopType: application.shopType,
            openingTime: application.openingTime,
            closingTime: application.closingTime,
            availableDays: application.availableDays,
            isAvailable: application.isAvailable,
            approved: true, // Set shop as approved
          },
        });

        // Update user to be shop owner
        await prisma.user.update({
          where: { id: application.userId },
          data: { isShopOwner: true },
        });

        return res.status(200).json({
          message: 'Application approved successfully',
          application: updatedApplication,
          shop: shop,
        });
      }

      return res.status(200).json({
        message: 'Application rejected successfully',
        application: updatedApplication,
      });

    } catch (error) {
      console.error('Error processing shop application:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};

export default adminMiddleware(handler);

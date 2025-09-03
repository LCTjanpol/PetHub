// File: imageUtils.ts
// Description: Utility functions for handling image URLs consistently

// Get the base URL for images (without /api suffix)
const getBaseUrl = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.254.140:3000/api';
  // Remove /api suffix to get base URL
  return apiUrl.replace('/api', '');
};

/**
 * Formats an image URL to use the correct base URL
 * @param imagePath - The image path (e.g., '/uploads/image.jpg')
 * @returns The complete image URL
 */
export const formatImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || imagePath.trim() === '') return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /uploads, prepend the base URL
  if (imagePath.startsWith('/uploads')) {
    return `${getBaseUrl()}${imagePath}`;
  }
  
  // If it doesn't start with /, assume it's a relative path
  if (!imagePath.startsWith('/')) {
    return `${getBaseUrl()}/uploads/${imagePath}`;
  }
  
  // Default case: prepend base URL
  return `${getBaseUrl()}${imagePath}`;
};

/**
 * Gets the base URL for the application
 * @returns The base URL without /api suffix
 */
export const getImageBaseUrl = () => getBaseUrl();

/**
 * Cloudinary Image Upload Utility
 * 
 * This utility handles image uploads to Cloudinary using unsigned uploads.
 * Make sure to set up an upload preset in Cloudinary dashboard.
 */

interface UploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload an image file to Cloudinary
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'pets', 'profile-photos')
 * @returns The secure URL of the uploaded image
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'pets'
): Promise<string> {
  // Validate file size (10MB limit for Cloudinary free tier)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`Image size exceeds 10MB limit. Please use a smaller image. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Invalid file type. Please upload an image file.');
  }

  // Check if required environment variables are set
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env.local file.');
  }

  if (!uploadPreset) {
    throw new Error('Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your .env.local file.');
  }

  try {
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Note: Transformations should be configured in the upload preset
    // This keeps the upload simple and secure
    
    // Upload to Cloudinary
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Upload failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data: UploadResponse = await response.json();

    if (!data.secure_url) {
      throw new Error('Upload succeeded but no URL was returned.');
    }

    return data.secure_url;
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }
    
    if (error.message.includes('413') || error.message.includes('too large')) {
      throw new Error('Image is too large. Please use an image smaller than 10MB.');
    }

    // Re-throw with original message if it's already user-friendly
    throw error;
  }
}

/**
 * Delete an image from Cloudinary by public_id
 * Note: This requires server-side implementation with API secret
 * For client-side deletion, create an API route
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  // This would need to be implemented server-side with API secret
  // For now, we'll leave images in Cloudinary (free tier has 25GB)
  console.warn('Image deletion not implemented. Images will remain in Cloudinary.');
}

/**
 * Generate optimized image URL with transformations
 * @param imageUrl - The Cloudinary URL or public_id
 * @param options - Transformation options
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string {
  // If it's already a Cloudinary URL, add transformations
  if (imageUrl.includes('cloudinary.com')) {
    const parts = imageUrl.split('/upload/');
    if (parts.length === 2) {
      const transformations: string[] = [];
      
      if (options?.width) transformations.push(`w_${options.width}`);
      if (options?.height) transformations.push(`h_${options.height}`);
      if (options?.quality) transformations.push(`q_${options.quality}`);
      else transformations.push('q_auto');
      if (options?.format) transformations.push(`f_${options.format}`);
      else transformations.push('f_auto');
      
      const transformString = transformations.join(',');
      return `${parts[0]}/upload/${transformString}/${parts[1]}`;
    }
  }
  
  // Return original URL if not a Cloudinary URL
  return imageUrl;
}


import {v2 as cloudinary} from 'cloudinary'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

// Configure Cloudinary with proper environment variable handling
if (process.env.CLOUDINARY_URL) {
  // Use CLOUDINARY_URL if available (recommended for production)
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Use individual credentials if CLOUDINARY_URL is not available
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
} else {
  console.warn('Cloudinary credentials not found. File uploads will use local storage in development.');
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file) {
  const errors = [];

  if (!file) {
    errors.push('No file provided');
    return errors;
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    errors.push('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push('File size exceeds 5MB limit.');
  }

  return errors;
}

// Helper function to check if Cloudinary is configured
function isCloudinaryConfigured() {
  return process.env.CLOUDINARY_URL || 
         (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

// Local file storage fallback for development
async function saveFileLocally(file, applicantId, jobId) {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'resumes');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${applicantId}-${jobId}-${timestamp}.${fileExtension}`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return public URL
    return `/uploads/resumes/${filename}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw new Error('Failed to save file locally');
  }
}

export async function uploadResumeFile(file, applicantId, jobId) {
  try {
    // Validate file
    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join(', '));
    }

    // Check if Cloudinary is configured
    if (isCloudinaryConfigured()) {
      // Use Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique public ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const publicId = `job_applications/resumes/${applicantId}-${jobId}-${timestamp}`;

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // Use 'raw' for non-image files
          public_id: publicId,
          folder: 'job_applications/resumes',
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    console.log('File uploaded successfully to Cloudinary:', result.secure_url);
    return result.secure_url;
    } else {
      // Fallback to local storage for development
      console.log('Cloudinary not configured, using local storage');
      const localUrl = await saveFileLocally(file, applicantId, jobId);
      return localUrl;
    }

  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Delete file from Cloudinary (useful for cleanup)
export async function deleteResumeFile(publicId) {
  try {
    if (isCloudinaryConfigured()) {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    
    console.log('File deleted from Cloudinary:', result);
    return result;
    } else {
      console.log('Cloudinary not configured, skipping file deletion');
      return { result: 'ok' };
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Extract public ID from Cloudinary URL (useful for deletion)
export function extractPublicIdFromUrl(cloudinaryUrl) {
  try {
    // Check if it's a Cloudinary URL
    if (!cloudinaryUrl.includes('cloudinary.com')) {
      throw new Error('Not a Cloudinary URL');
    }

    // Extract public ID from Cloudinary URL
    // Example URL: https://res.cloudinary.com/dtfono0m6/raw/upload/v1234567890/job_applications/resumes/user123-job456-1234567890.pdf
    const urlParts = cloudinaryUrl.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    // Get everything after 'upload/v{version}/'
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    
    // Remove file extension from the last part
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    throw new Error('Failed to extract public ID from URL');
  }
}

// Get file info from Cloudinary
export async function getFileInfo(publicId) {
  try {
    if (isCloudinaryConfigured()) {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw'
    });
    
    return {
      url: result.secure_url,
      size: result.bytes,
      format: result.format,
      created: result.created_at,
      publicId: result.public_id
    };
    } else {
      throw new Error('Cloudinary is not configured');
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

// Generate a signed URL for secure file access (optional)
export function generateSignedUrl(publicId, options = {}) {
  try {
    if (isCloudinaryConfigured()) {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + (options.expiresIn || 3600), // Default 1 hour
      ...options
    });
    
    return signedUrl;
    } else {
      throw new Error('Cloudinary is not configured');
    }
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL');
  }
}

export default cloudinary;
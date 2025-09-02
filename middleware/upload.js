import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    switch (file.fieldname) {
      case 'bannerImage':
        uploadPath += 'banners/';
        break;
      case 'categoryImage':
        uploadPath += 'categories/';
        break;
      case 'logo':
        uploadPath += 'logos/';
        break;
      case 'coverImage':
        uploadPath += 'covers/';
        break;
      case 'tinCertificate':
        uploadPath += 'documents/';
        break;
      default:
        uploadPath += 'general/';
    }
    
    // Ensure directory exists
    ensureDirectoryExists(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// More flexible file filter - allows images for tinCertificate too
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
  const isDoc = allowedDocTypes.test(extname) && 
    (file.mimetype.includes('pdf') || 
     file.mimetype.includes('document') || 
     file.mimetype.includes('msword') ||
     file.mimetype.includes('officedocument'));

  console.log(`File validation - Field: ${file.fieldname}, Original: ${file.originalname}, MIME: ${file.mimetype}, Extension: ${extname}`);

  // For documents (TIN certificate) - now accepts both images and documents
  if (file.fieldname === 'tinCertificate') {
    if (isDoc || isImage) {
      console.log('TIN certificate file accepted');
      return cb(null, true);
    } else {
      console.log('TIN certificate file rejected');
      return cb(new Error('Only PDF, DOC, DOCX, or image files (JPEG, JPG, PNG, GIF, WebP) are allowed for TIN certificate'));
    }
  }

  // For all other fields (images only)
  if (isImage) {
    console.log('Image file accepted');
    return cb(null, true);
  } else {
    console.log('File rejected - not a valid image');
    return cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
  }
};

// Configure multer with more flexible settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
export const handleMulterError = (error, req, res, next) => {
  console.error('Multer error:', error);
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files per request.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: `Unexpected file field: ${error.field}. Make sure you're using the correct field names: logo, coverImage, bannerImage, categoryImage, tinCertificate`
        });
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts in the request.'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`
        });
    }
  }

  // Custom validation errors
  if (error.message && error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    message: 'File upload error'
  });
};

// Create a completely flexible upload middleware for testing
export const flexibleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log(`Flexible upload - Field: ${file.fieldname}, File: ${file.originalname}, MIME: ${file.mimetype}`);
    
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMimeType = file.mimetype.startsWith('image/') || 
                           file.mimetype.includes('pdf') || 
                           file.mimetype.includes('document') || 
                           file.mimetype.includes('msword') ||
                           file.mimetype.includes('officedocument');

    if (extname && isValidMimeType) {
      console.log('File accepted by flexible upload');
      return cb(null, true);
    } else {
      console.log('File rejected by flexible upload');
      return cb(new Error(`File type not allowed. Received: ${file.mimetype}, Extension: ${path.extname(file.originalname)}`));
    }
  }
});

// Super permissive upload for debugging (accepts any file type)
export const debugUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log(`Debug upload - accepting all files. Field: ${file.fieldname}, File: ${file.originalname}`);
    return cb(null, true); // Accept everything for debugging
  }
});

export default upload;
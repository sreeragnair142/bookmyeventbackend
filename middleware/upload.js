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

// Storage configuration with better error handling
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Handle different field names including variations
    switch (file.fieldname) {
      case 'bannerImage':
      case 'bannerImageEn':
      case 'image':
      case 'imageEn':
        uploadPath += 'banners/';
        break;
      case 'categoryImage':
      case 'auditoriumCategoryImage': // Added this line
        uploadPath += 'categories/';
        break;
      case 'logo':
        uploadPath += 'logos/';
        break;
      case 'coverImage':
        uploadPath += 'covers/';
        break;
      case 'tinCertificate':
      case 'documents':
        uploadPath += 'documents/';
        break;
      case 'additionalFile':
      case 'additionalFileEn':
        uploadPath += 'additional/';
        break;
      case 'thumbnail':
        uploadPath += 'thumbnails/';
        break;
      case 'images':
        uploadPath += 'vehicle-images/';
        break;
      default:
        uploadPath += 'general/';
    }
    
    try {
      ensureDirectoryExists(uploadPath);
      console.log(`Upload destination set: ${uploadPath} for field: ${file.fieldname}`);
      cb(null, uploadPath);
    } catch (error) {
      console.error('Directory creation error:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      console.log(`Generated filename: ${filename} for original: ${file.originalname}`);
      cb(null, filename);
    } catch (error) {
      console.error('Filename generation error:', error);
      cb(error);
    }
  }
});

// Comprehensive file filter with better logging
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp|svg/;
  const allowedDocTypes = /pdf|doc|docx|txt/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImageTypes.test(extname) && file.mimetype.startsWith('image/');
  const isDoc = allowedDocTypes.test(extname) && 
    (file.mimetype.includes('pdf') || 
     file.mimetype.includes('document') || 
     file.mimetype.includes('msword') ||
     file.mimetype.includes('officedocument') ||
     file.mimetype.includes('text/'));

  console.log(`File validation:
    Field: ${file.fieldname}
    Original: ${file.originalname}
    MIME: ${file.mimetype}
    Extension: ${extname}
    Is Image: ${isImage}
    Is Document: ${isDoc}`);

  // Handle image-only fields - UPDATED to include auditoriumCategoryImage
  if (['thumbnail', 'bannerImage', 'bannerImageEn', 'image', 'imageEn', 'categoryImage', 'auditoriumCategoryImage', 'logo', 'coverImage', 'images'].includes(file.fieldname)) {
    if (isImage) {
      console.log(`✅ Image file accepted for ${file.fieldname}`);
      return cb(null, true);
    } else {
      console.log(`❌ File rejected for ${file.fieldname} - not a valid image`);
      return cb(new Error(`Only image files (JPEG, JPG, PNG, GIF, WebP, SVG) are allowed for ${file.fieldname}`));
    }
  }

  // Handle document fields (can be images or documents)
  if (['tinCertificate', 'documents', 'additionalFile', 'additionalFileEn'].includes(file.fieldname)) {
    if (isDoc || isImage) {
      console.log(`✅ File accepted for ${file.fieldname}`);
      return cb(null, true);
    } else {
      console.log(`❌ File rejected for ${file.fieldname} - invalid type`);
      return cb(new Error(`Only PDF, DOC, DOCX, TXT, or image files are allowed for ${file.fieldname}`));
    }
  }

  // Default case - accept images
  if (isImage) {
    console.log('✅ Default image file accepted');
    return cb(null, true);
  } else {
    console.log('❌ Default rejection - not a valid image');
    return cb(new Error('Only image files are allowed by default'));
  }
};

// Main upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files per request
    fieldSize: 10 * 1024 * 1024 // 10MB field size limit
  },
  fileFilter: fileFilter
});

// Enhanced error handling middleware - UPDATED error message
export const handleMulterError = (error, req, res, next) => {
  console.error('Multer error details:', {
    message: error.message,
    code: error.code,
    field: error.field,
    stack: error.stack
  });
  
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
          error: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum is 10 files per request.',
          error: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: `Unexpected file field: ${error.field}. Allowed fields: thumbnail, images, bannerImage, bannerImageEn, categoryImage, auditoriumCategoryImage, logo, coverImage, tinCertificate, documents, additionalFile, additionalFileEn`,
          error: 'UNEXPECTED_FIELD'
        });
      case 'LIMIT_PART_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many parts in the request.',
          error: 'TOO_MANY_PARTS'
        });
      case 'LIMIT_FIELD_KEY':
        return res.status(400).json({
          success: false,
          message: 'Field name too long.',
          error: 'FIELD_NAME_TOO_LONG'
        });
      case 'LIMIT_FIELD_VALUE':
        return res.status(400).json({
          success: false,
          message: 'Field value too long.',
          error: 'FIELD_VALUE_TOO_LONG'
        });
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many fields.',
          error: 'TOO_MANY_FIELDS'
        });
      default:
        return res.status(400).json({
          success: false,
          message: `Upload error: ${error.message}`,
          error: 'UPLOAD_ERROR'
        });
    }
  }

  // Custom validation errors
  if (error.message && error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  // Generic error
  console.error('Unexpected upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'File upload error occurred',
    error: 'UPLOAD_FAILED'
  });
};

// Specific upload configurations for different use cases

// Banner upload - handles both default and English versions
export const bannerUpload = upload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'bannerImageEn', maxCount: 1 },
  { name: 'additionalFile', maxCount: 1 },
  { name: 'additionalFileEn', maxCount: 1 }
]);

// Single banner image upload
export const singleBannerUpload = upload.single('bannerImage');

// Category upload - UPDATED to include auditoriumCategoryImage
export const categoryUpload = upload.fields([
  { name: 'categoryImage', maxCount: 1 },
  { name: 'auditoriumCategoryImage', maxCount: 1 } // Added this line
]);

// Auditorium Category specific upload
export const auditoriumCategoryUpload = upload.single('auditoriumCategoryImage');

// Store upload - updated to include thumbnail, images, and documents
export const storeUpload = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
  { name: 'logo', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'tinCertificate', maxCount: 1 },
  { name: 'documents', maxCount: 10 }
]);

// Flexible upload for testing/debugging
export const flexibleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log(`Flexible upload accepting: Field: ${file.fieldname}, File: ${file.originalname}, MIME: ${file.mimetype}`);
    
    const allowedTypes = /jpeg|jpg|png|gif|webp|svg|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      console.log('✅ File accepted by flexible upload');
      return cb(null, true);
    } else {
      console.log('❌ File rejected by flexible upload');
      return cb(new Error(`File type not allowed. Extension: ${path.extname(file.originalname)}`));
    }
  }
});

// Debug upload (accepts everything) - use only for debugging
export const debugUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for debugging
    files: 10
  },
  fileFilter: (req, file, cb) => {
    console.log(`🔧 DEBUG: Accepting all files. Field: ${file.fieldname}, File: ${file.originalname}`);
    return cb(null, true);
  }
});

// Utility function to log upload details
export const logUploadDetails = (req, res, next) => {
  console.log('\n=== Upload Request Details ===');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  console.log('Files:', req.files);
  console.log('Headers:', req.headers);
  console.log('==============================\n');
  next();
};

export default upload;
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedDocTypes = /pdf|doc|docx/;
  
  const extname = allowedImageTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedImageTypes.test(file.mimetype);
  
  // For documents (TIN certificate)
  if (file.fieldname === 'tinCertificate') {
    const docExtname = allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
    const docMimetype = file.mimetype.includes('pdf') || 
                       file.mimetype.includes('document') ||
                       file.mimetype.includes('msword');
    
    if (docExtname && docMimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only PDF, DOC, and DOCX files are allowed for documents'));
    }
  }
  
  // For images
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    return cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed'));
  }
};

// Configure multer
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
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per request.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (error.message.includes('Only')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

export default upload;
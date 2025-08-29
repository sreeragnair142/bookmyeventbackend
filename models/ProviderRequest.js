import mongoose from 'mongoose';

const providerRequestSchema = new mongoose.Schema({
  // Store Information
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  storeAddress: {
    type: String,
    required: [true, 'Store address is required'],
    trim: true
  },
  logo: {
    type: String
  },
  coverImage: {
    type: String
  },
  
  // Owner Information
  ownerFirstName: {
    type: String,
    required: [true, 'Owner first name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  ownerLastName: {
    type: String,
    required: [true, 'Owner last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  ownerPhone: {
    type: String,
    required: [true, 'Owner phone is required'],
    trim: true
  },
  ownerEmail: {
    type: String,
    required: [true, 'Owner email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Business Information
  businessTIN: {
    type: String,
    required: [true, 'Business TIN is required'],
    trim: true
  },
  tinExpireDate: {
    type: Date,
    required: [true, 'TIN expire date is required']
  },
  tinCertificate: {
    type: String,
    required: [true, 'TIN certificate is required']
  },
  
  // Module and Zone
  module: {
    type: String,
    enum: ['restaurant', 'grocery', 'pharmacy', 'electronics', 'fashion'],
    required: [true, 'Module is required']
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone is required']
  },
  latitude: {
    type: Number,
    required: [true, 'Latitude is required']
  },
  longitude: {
    type: Number,
    required: [true, 'Longitude is required']
  },
  
  // Delivery Information
  estimatedDeliveryTime: {
    min: {
      type: Number,
      required: [true, 'Minimum delivery time is required']
    },
    max: {
      type: Number,
      required: [true, 'Maximum delivery time is required']
    }
  },
  
  // Request Status
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin Actions
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  
  // Related Provider (if approved)
  approvedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider'
  }
}, {
  timestamps: true
});

// Indexes for performance
providerRequestSchema.index({ status: 1, createdAt: -1 });
providerRequestSchema.index({ zone: 1, status: 1 });
providerRequestSchema.index({ module: 1, status: 1 });
providerRequestSchema.index({ businessTIN: 1 });
providerRequestSchema.index({ ownerEmail: 1 });

export default mongoose.model('ProviderRequest', providerRequestSchema);
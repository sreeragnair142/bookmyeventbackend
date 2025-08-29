import mongoose from 'mongoose';

const providerSchema = new mongoose.Schema({
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
    trim: true,
    unique: true  // ✅ This creates the index automatically
  },
  tinExpireDate: {
    type: Date,
    required: [true, 'TIN expire date is required']
  },
  tinCertificate: {
    type: String,
    required: [true, 'TIN certificate is required']
  },
  
  // Location and Zone
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
  
  // Status and Features
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // Categories
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Ratings and Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  
  // Account Information
  accountHolder: {
    type: String,
    trim: true
  },
  accountNumber: {
    type: String,
    trim: true
  },
  bankName: {
    type: String,
    trim: true
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// ✅ Indexes for performance (removed duplicate businessTIN index)
providerSchema.index({ zone: 1, isActive: 1, isApproved: 1 });
providerSchema.index({ isFeatured: 1, isActive: 1 });
// providerSchema.index({ businessTIN: 1 }); // ❌ REMOVED - duplicate of unique: true
providerSchema.index({ ownerEmail: 1 });
providerSchema.index({ location: '2dsphere' });

export default mongoose.model('Provider', providerSchema);
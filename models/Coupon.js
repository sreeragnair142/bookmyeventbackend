// ===== COUPON MODEL (Coupon.js) =====
import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Coupon title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{3,20}$/, 'Coupon code must be 3-20 characters, alphanumeric only']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: [true, 'Coupon type is required']
  },
  discount: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount cannot be negative']
  },
  discountType: {
    type: String,
    enum: ['percentage', 'amount'],
    required: [true, 'Discount type is required']
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: [0, 'Minimum purchase cannot be negative']
  },
  maxDiscount: {
    type: Number,
    min: [0, 'Maximum discount cannot be negative']
  },
  totalUses: {
    type: Number,
    default: 1,
    min: [1, 'Total uses must be at least 1']
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  expireDate: {
    type: Date,
    required: [true, 'Expire date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableStores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
couponSchema.index({ isActive: 1, startDate: 1, expireDate: 1 });
couponSchema.index({ type: 1 });

// Validate expire date
couponSchema.pre('save', function(next) {
  if (this.expireDate <= this.startDate) {
    next(new Error('Expire date must be after start date'));
  } else {
    next();
  }
});

// Validate expire date on update
couponSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.startDate || update.expireDate) {
    const startDate = update.startDate || this.getQuery().startDate;
    const expireDate = update.expireDate || this.getQuery().expireDate;
    
    if (startDate && expireDate && new Date(expireDate) <= new Date(startDate)) {
      next(new Error('Expire date must be after start date'));
    }
  }
  next();
});

export default mongoose.model('Coupon', couponSchema);
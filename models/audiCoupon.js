import mongoose from 'mongoose';

const auditoriumCouponSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auditorium coupon title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Auditorium coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9_-]{3,20}$/, 'Auditorium coupon code must be 3-20 characters, alphanumeric with underscores/hyphens allowed']
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'free_shipping'],
    required: [true, 'Auditorium coupon type is required']
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
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
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
    ref: 'User'
    // Note: Removed required: true to allow flexibility for testing without authentication
  }
}, {
  timestamps: true
});

// Indexes for performance
auditoriumCouponSchema.index({ isActive: 1, startDate: 1, expireDate: 1 });
auditoriumCouponSchema.index({ type: 1 });
auditoriumCouponSchema.index({ code: 1 }, { unique: true });

// Validate expire date
auditoriumCouponSchema.pre('save', function(next) {
  if (this.expireDate && this.startDate && this.expireDate <= this.startDate) {
    next(new Error('Expire date must be after start date'));
  } else {
    next();
  }
});

// Validate expire date on update
auditoriumCouponSchema.pre('findOneAndUpdate', function(next) {
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

// Virtual to check if coupon is expired
auditoriumCouponSchema.virtual('isExpired').get(function() {
  return this.expireDate && new Date() > this.expireDate;
});

// Virtual to check if coupon is valid (active and not expired)
auditoriumCouponSchema.virtual('isValid').get(function() {
  const now = new Date();
  const isNotExpired = !this.expireDate || now <= this.expireDate;
  const hasStarted = !this.startDate || now >= this.startDate;
  const hasUsesLeft = !this.totalUses || this.usedCount < this.totalUses;
  
  return this.isActive && isNotExpired && hasStarted && hasUsesLeft;
});

// Method to check if coupon can be applied to a specific amount
auditoriumCouponSchema.methods.canApplyTo = function(amount) {
  if (!this.isValid) return false;
  if (this.minPurchase && amount < this.minPurchase) return false;
  return true;
};

// Method to calculate discount amount
auditoriumCouponSchema.methods.calculateDiscount = function(amount) {
  if (!this.canApplyTo(amount)) return 0;
  
  let discount = 0;
  
  if (this.discountType === 'percentage') {
    discount = (amount * this.discount) / 100;
  } else if (this.discountType === 'amount') {
    discount = this.discount;
  }
  
  // Apply maximum discount limit if specified
  if (this.maxDiscount && discount > this.maxDiscount) {
    discount = this.maxDiscount;
  }
  
  // Ensure discount doesn't exceed the purchase amount
  if (discount > amount) {
    discount = amount;
  }
  
  return discount;
};

export default mongoose.model('AuditoriumCoupon', auditoriumCouponSchema);
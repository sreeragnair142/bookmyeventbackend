import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      required: true
    },
    image: {
      type: String,
      required: [true, 'Brand image is required']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// ✅ Indexes for performance
brandSchema.index({ slug: 1 });
brandSchema.index({ isActive: 1, displayOrder: 1 });
brandSchema.index({ isFeatured: 1 });

// ✅ Generate slug from name before saving
brandSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // trim - from start & end
  }
  next();
});

export default mongoose.model('Brand', brandSchema);

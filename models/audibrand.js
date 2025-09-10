import mongoose from 'mongoose';

const venueBrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Venue brand name is required'],
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
      required: [true, 'Venue brand image is required']
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
venueBrandSchema.index({ slug: 1 });
venueBrandSchema.index({ isActive: 1, displayOrder: 1 });
venueBrandSchema.index({ isFeatured: 1 });

// ✅ Generate slug from name before saving
venueBrandSchema.pre('save', function (next) {
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

export default mongoose.model('VenueBrand', venueBrandSchema);

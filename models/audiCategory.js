// Updated Model: audiCategory.js
// No changes needed, as the model is already correct

import mongoose from 'mongoose';

const auditoriumCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Auditorium category name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Auditorium category image is required']
  },
  slug: {
    type: String,
    unique: true,
    required: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuditoriumCategory',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// ✅ Indexes for performance
auditoriumCategorySchema.index({ isActive: 1, displayOrder: 1 });
auditoriumCategorySchema.index({ parentCategory: 1 });
auditoriumCategorySchema.index({ isFeatured: 1 });

// Generate slug before saving
auditoriumCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  next();
});

export default mongoose.model('AuditoriumCategory', auditoriumCategorySchema);
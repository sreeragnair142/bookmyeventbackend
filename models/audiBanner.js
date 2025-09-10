import mongoose from 'mongoose';

const auditoriumBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Auditorium banner title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  image: {
    type: String,
    required: [true, 'Auditorium banner image is required']
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: [true, 'Zone is required']
  },
  bannerType: {
    type: String,
    enum: ['default', 'store_wise', 'zone_wise'],
    default: 'default',
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  clickCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditoriumBannerSchema.index({ zone: 1, isActive: 1 });
auditoriumBannerSchema.index({ bannerType: 1 });
auditoriumBannerSchema.index({ isFeatured: 1, isActive: 1 });
auditoriumBannerSchema.index({ displayOrder: 1 });
auditoriumBannerSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model('AuditoriumBanner', auditoriumBannerSchema);
import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Zone name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Polygon'],
      required: true
    },
    coordinates: {
      type: [[[Number]]],
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  deliveryCharge: {
    type: Number,
    default: 0,
    min: [0, 'Delivery charge cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Geospatial index for location queries
zoneSchema.index({ coordinates: '2dsphere' });
zoneSchema.index({ isActive: 1 });

export default mongoose.model('Zone', zoneSchema);
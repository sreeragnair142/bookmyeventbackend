import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a vehicle name'],
    trim: true,
    maxlength: [100, 'Name can not be more than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description can not be more than 500 characters'],
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Please select a brand'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category'],
  },
  model: {
    type: String,
    required: [true, 'Please add a model'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Please select vehicle type'],
    enum: ['sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'truck', 'van', 'motorcycle'],
  },
  engineCapacity: {
    type: Number,
    required: [true, 'Please add engine capacity'],
  },
  enginePower: {
    type: Number,
    required: [true, 'Please add engine power'],
  },
  seatingCapacity: {
    type: Number,
    required: [true, 'Please add seating capacity'],
  },
  airCondition: {
    type: Boolean,
    default: false,
  },
  fuelType: {
    type: String,
    required: [true, 'Please select fuel type'],
    enum: ['petrol', 'diesel', 'electric', 'hybrid'],
  },
  transmissionType: {
    type: String,
    required: [true, 'Please select transmission type'],
    enum: ['manual', 'automatic'],
  },
  pricing: {
    hourly: { type: Number, default: 0 },
    perDay: { type: Number, default: 0 },
    distanceWise: { type: Number, default: 0 },
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  images: [{
    type: String,
  }],
  thumbnail: {
    type: String,
  },
  searchTags: [{
    type: String,
  }],
  vinNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  licensePlateNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  documents: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  totalTrips: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

VehicleSchema.index({ provider: 1, isActive: 1 });
VehicleSchema.index({ brand: 1, category: 1 });
VehicleSchema.index({ isAvailable: 1, createdAt: -1 });
VehicleSchema.index({ vinNumber: 1 }, { unique: true, sparse: true });
VehicleSchema.index({ licensePlateNumber: 1 }, { unique: true, sparse: true });

export default mongoose.model('Vehicle', VehicleSchema);
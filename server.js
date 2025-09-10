import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import bannerRoutes from './routes/banners.js';
import couponRoutes from './routes/coupons.js';
import categoryRoutes from './routes/categories.js';
import zoneRoutes from './routes/zones.js';
import providerRoutes from './routes/providers.js';
import providerRequestRoutes from './routes/providerRequests.js';
import dashboardRoutes from './routes/dashboard.js';
import storeRoutes from './routes/stores.js';
import auditoriumBannerRoutes from './routes/audiBannerRoutes.js';
import auditoriumCategoryRoutes from './routes/audicategoryRoutes.js';
import auditoriumRoutes from './routes/audi.js'; // Added auditorium routes
import auditoriumCoupons from './routes/audiCouponRoutes.js'; // Added auditorium routes
import brands from './routes/brandroutes.js'; // Added auditorium routes
import vehicleroutes from './routes/vehicle.js'; // Added auditorium routes
import Audibrands from './routes/audibrand.js'; // Added auditorium routes




// Error handling middleware
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ---------------- Security ----------------
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// ---------------- CORS ----------------
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// ---------------- Parsers ----------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------- Static Files ----------------
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// ---------------- Routes ----------------
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/provider-requests', providerRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/auditoriumcategories', auditoriumCategoryRoutes);
// app.use('/api/auditorium-categories', auditoriumCategoryRoutes);
app.use('/api/auditoriums', auditoriumRoutes); // Added auditorium routes
app.use('/api/auditorium-coupons', auditoriumCoupons); // Added auditorium routes
app.use('/api/auditorium-banner', auditoriumBannerRoutes); // Added auditorium routes
app.use('/api/brands', brands);
app.use('/api/audibrands', Audibrands);

app.use('/api/vehicles', vehicleroutes);






// ---------------- Health Check ----------------
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// ---------------- Error Handling ----------------
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found' 
  });
});

// ---------------- MongoDB Connection ----------------
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(chalk.green(`MongoDB Connected: ${conn.connection.host}`));
  } catch (error) {
    console.error(chalk.red('Database connection error:'), error);
    process.exit(1);
  }
};

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(chalk.yellow(`Server running on port ${PORT}`));
    console.log(chalk.cyan(`Environment: ${process.env.NODE_ENV}`));
  });
};

startServer();
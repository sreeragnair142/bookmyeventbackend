import Banner from '../models/Banner.js';
import Coupon from '../models/Coupon.js';
import Category from '../models/Category.js';
import Provider from '../models/Provider.js';
import ProviderRequest from '../models/ProviderRequest.js';
import User from '../models/User.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalBanners,
      activeBanners,
      totalCoupons,
      activeCoupons,
      totalCategories,
      activeCategories,
      totalProviders,
      activeProviders,
      pendingRequests,
      totalUsers
    ] = await Promise.all([
      Banner.countDocuments(),
      Banner.countDocuments({ isActive: true }),
      Coupon.countDocuments(),
      Coupon.countDocuments({ isActive: true }),
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Provider.countDocuments(),
      Provider.countDocuments({ isActive: true, isApproved: true }),
      ProviderRequest.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true })
    ]);

    // Recent activities
    const recentBanners = await Banner.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentRequests = await ProviderRequest.find()
      .populate('zone', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        stats: {
          banners: { total: totalBanners, active: activeBanners },
          coupons: { total: totalCoupons, active: activeCoupons },
          categories: { total: totalCategories, active: activeCategories },
          providers: { total: totalProviders, active: activeProviders },
          pendingRequests,
          totalUsers
        },
        recentActivity: {
          recentBanners,
          recentRequests
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};
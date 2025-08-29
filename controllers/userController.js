import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role,
      isActive,
      search 
    } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { users }, pagination, 'Users fetched successfully');
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse(res, 'Error fetching users', 500);
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User fetched successfully');
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse(res, 'Error fetching user', 500);
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Don't allow password updates through this endpoint
    const updateData = { ...req.body };
    delete updateData.password;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    return successResponse(res, { user: updatedUser }, 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse(res, 'Error updating user', 500);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return errorResponse(res, 'Cannot delete the last admin user', 400);
      }
    }

    await User.findByIdAndDelete(req.params.id);

    return successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse(res, 'Error deleting user', 500);
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Prevent deactivating the last admin
    if (user.role === 'admin' && user.isActive) {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount <= 1) {
        return errorResponse(res, 'Cannot deactivate the last admin user', 400);
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    return successResponse(res, { user }, `User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle user status error:', error);
    return errorResponse(res, 'Error updating user status', 500);
  }
};

export const getUserStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    return successResponse(res, {
      totalUsers,
      activeUsers,
      roleStats: stats
    }, 'User statistics fetched successfully');
  } catch (error) {
    console.error('Get user stats error:', error);
    return errorResponse(res, 'Error fetching user statistics', 500);
  }
};
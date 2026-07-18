import { StatusCodes } from 'http-status-codes';
import UserModel from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';
import PayModel from '~/models/payModel.js';
import VipTierModel from '~/models/vipTierModel.js';

const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find({})
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    const paidSums = await PayModel.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: '$user', totalSpent: { $sum: '$totalAmount' } } }
    ]);

    const spentMap = {};
    paidSums.forEach(item => {
      if (item._id) {
        spentMap[item._id.toString()] = item.totalSpent;
      }
    });

    const tiers = await VipTierModel.find({}).sort({ minSpent: 1 });

    const usersWithVip = users.map(user => {
      const totalSpent = spentMap[user._id.toString()] || 0;
      let currentTier = null;
      let nextTier = null;

      for (let i = 0; i < tiers.length; i++) {
        if (totalSpent >= tiers[i].minSpent) {
          currentTier = tiers[i];
        } else {
          nextTier = tiers[i];
          break;
        }
      }

      return {
        ...user.toObject(),
        totalSpent,
        currentTier: currentTier ? {
          _id: currentTier._id,
          name: currentTier.name,
          minSpent: currentTier.minSpent,
          discount: currentTier.discount,
          color: currentTier.color
        } : {
          name: 'Thành viên thường',
          minSpent: 0,
          discount: 0,
          color: ''
        },
        nextTier: nextTier ? {
          name: nextTier.name,
          minSpent: nextTier.minSpent,
          discount: nextTier.discount,
          color: nextTier.color,
          needed: nextTier.minSpent - totalSpent
        } : null
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: usersWithVip,
      message: 'Lấy danh sách người dùng thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, address, role, isActive } = req.body;
    const user = await UserModel.findById(id);

    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Người dùng không tồn tại!');
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await UserModel.findById(id).select('-password -refreshToken');

    res.status(StatusCodes.OK).json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật thông tin người dùng thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Người dùng không tồn tại!');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa người dùng thành công!',
    });
  } catch (error) {
    next(error);
  }
};

export const UserController = {
  getAllUsers,
  updateUser,
  deleteUser,
};

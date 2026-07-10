import { StatusCodes } from 'http-status-codes';
import UserModel from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';

const getAllUsers = async (req, res, next) => {
  try {
    const users = await UserModel.find({})
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
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

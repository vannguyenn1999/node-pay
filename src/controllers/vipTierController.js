import { StatusCodes } from 'http-status-codes';
import VipTierModel from '~/models/vipTierModel.js';
import ApiError from '~/utils/ApiError.js';

const getAllVipTiers = async (req, res, next) => {
  try {
    const vipTiers = await VipTierModel.find({}).sort({ minSpent: 1 });
    res.status(StatusCodes.OK).json({
      success: true,
      data: vipTiers,
      message: 'Lấy danh sách phân hạng VIP thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const createVipTier = async (req, res, next) => {
  try {
    const { name, minSpent, discount, color, isActive } = req.body;
    if (!name || minSpent === undefined || discount === undefined) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thiếu thông tin phân hạng VIP!');
    }

    const existing = await VipTierModel.findOne({ name });
    if (existing) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Tên phân hạng VIP đã tồn tại!');
    }

    const newTier = await VipTierModel.create({
      name,
      minSpent,
      discount,
      color,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      data: newTier,
      message: 'Tạo phân hạng VIP mới thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const updateVipTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, minSpent, discount, color, isActive } = req.body;

    const vipTier = await VipTierModel.findById(id);
    if (!vipTier) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phân hạng VIP!');
    }

    if (name !== undefined && name !== vipTier.name) {
      const existing = await VipTierModel.findOne({ name });
      if (existing) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Tên phân hạng VIP đã tồn tại!');
      }
      vipTier.name = name;
    }

    if (minSpent !== undefined) vipTier.minSpent = minSpent;
    if (discount !== undefined) vipTier.discount = discount;
    if (color !== undefined) vipTier.color = color;
    if (isActive !== undefined) vipTier.isActive = isActive;

    await vipTier.save();

    res.status(StatusCodes.OK).json({
      success: true,
      data: vipTier,
      message: 'Cập nhật phân hạng VIP thành công!',
    });
  } catch (error) {
    next(error);
  }
};

const deleteVipTier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await VipTierModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy phân hạng VIP!');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa phân hạng VIP thành công!',
    });
  } catch (error) {
    next(error);
  }
};

export const VipTierController = {
  getAllVipTiers,
  createVipTier,
  updateVipTier,
  deleteVipTier,
};

import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';
import VoucherModel from '~/models/voucherModel.js';
import VoucherUsageModel from '~/models/voucherUsageModel.js';
import CartModel from '~/models/cartModel.js';
import UserModel from '~/models/userModel.js';
import ApiError from '~/utils/ApiError.js';

// --- ADMIN CONTROLLERS ---

const createVoucher = async (req, res, next) => {
  try {
    const existing = await VoucherModel.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã voucher này đã tồn tại!');
    }

    const voucher = await VoucherModel.create({
      ...req.body,
      code: req.body.code.toUpperCase(),
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo voucher mới thành công!',
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminVouchers = async (req, res, next) => {
  try {
    const vouchers = await VoucherModel.find({})
      .populate('applicableCategory', 'name')
      .populate('applicableProducts', 'name mainImage')
      .populate('applicableVariants', 'sku price storage color condition')
      .populate('allowedVipTiers', 'name')
      .sort({ createdAt: -1 });
    res.status(StatusCodes.OK).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

const updateVoucherStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const voucher = await VoucherModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy voucher!');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Trạng thái voucher được chuyển thành: ${isActive ? 'Hoạt động' : 'Tạm dừng'}`,
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

const updateVoucherLimits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { usageLimit, limitPerUser } = req.body;

    const updateFields = {};
    if (usageLimit !== undefined) updateFields.usageLimit = usageLimit;
    if (limitPerUser !== undefined) updateFields.limitPerUser = limitPerUser;

    const voucher = await VoucherModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy voucher!');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật giới hạn voucher thành công!',
      data: voucher,
    });
  } catch (error) {
    next(error);
  }
};

const getVoucherUsages = async (req, res, next) => {
  try {
    const { voucherId, userId, status } = req.query;
    const query = {};
    if (voucherId) query.voucher = voucherId;
    if (userId) query.user = userId;
    if (status) query.status = status;

    const usages = await VoucherUsageModel.find(query)
      .populate('user', 'name email')
      .populate('voucher', 'code discountType discountValue')
      .populate('bill')
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: usages,
    });
  } catch (error) {
    next(error);
  }
};

const voidUsage = async (req, res, next) => {
  const { usageId } = req.params;
  const { reason } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const usage = await VoucherUsageModel.findOneAndUpdate(
      { _id: usageId, status: 'applied' },
      { status: 'voided', voidedAt: new Date(), voidedReason: reason || 'Admin cancelled' },
      { session, new: true }
    );

    if (!usage) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy lượt sử dụng khả dụng hoặc đã bị hủy trước đó!');
    }

    // Decrement the used count atomically
    await VoucherModel.updateOne(
      { _id: usage.voucher },
      { $inc: { usedCount: -1 } },
      { session }
    );

    await session.commitTransaction();
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Hủy bỏ lượt sử dụng voucher thành công. Quota đã được khôi phục!',
      data: usage,
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// --- USER CONTROLLERS ---

const getActiveVouchers = async (req, res, next) => {
  try {
    const now = new Date();
    const vouchers = await VoucherModel.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    next(error);
  }
};

const applyVoucher = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    // 1. Get voucher & validate existence/active status
    const voucher = await VoucherModel.findOne({ code: code.toUpperCase() });
    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Mã giảm giá không tồn tại!');
    }

    if (!voucher.isActive) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá hiện đã tạm khóa!');
    }

    const now = new Date();
    if (voucher.startDate > now || voucher.endDate < now) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá đã hết hạn hoặc chưa được bắt đầu!');
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Mã giảm giá đã được sử dụng hết số lượng cho phép!');
    }

    // 2. Validate user VIP tier restrictions
    const user = await UserModel.findById(userId).populate('vipTier');
    if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng!');
    }

    if (voucher.allowedVipTiers && voucher.allowedVipTiers.length > 0) {
      if (!user.vipTier || !voucher.allowedVipTiers.map(id => id.toString()).includes(user.vipTier._id.toString())) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Hạng thành viên của bạn không đủ điều kiện dùng mã này!');
      }
    }

    // 3. Validate user limit per user
    const userRedeemedCount = await VoucherUsageModel.countDocuments({
      user: userId,
      voucher: voucher._id,
      status: 'applied',
    });

    if (userRedeemedCount >= voucher.limitPerUser) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Bạn đã dùng mã giảm giá này tối đa ${voucher.limitPerUser} lần!`);
    }

    // 4. Load Cart and check scopes
    const cart = await CartModel.findOne({ user: userId })
      .populate('items.product')
      .populate('items.productVariant');

    if (!cart || cart.items.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Giỏ hàng của bạn đang trống!');
    }

    let subtotal = 0;
    cart.items.forEach(item => {
      if (item.productVariant) {
        subtotal += item.productVariant.price * item.quantity;
      }
    });

    if (subtotal < voucher.minOrderAmount) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Giá trị đơn hàng chưa đạt mức tối thiểu ${voucher.minOrderAmount} để sử dụng mã này!`);
    }

    // Calculate discount
    let eligibleAmount = 0;
    if (voucher.scope === 'all') {
      eligibleAmount = subtotal;
    } else {
      cart.items.forEach(item => {
        let isEligible = false;
        if (voucher.scope === 'variant' && voucher.applicableVariants.includes(item.productVariant._id.toString())) {
          isEligible = true;
        } else if (voucher.scope === 'product' && voucher.applicableProducts.includes(item.product._id.toString())) {
          isEligible = true;
        } else if (voucher.scope === 'category' && item.product.category.toString() === voucher.applicableCategory.toString()) {
          isEligible = true;
        }

        if (isEligible) {
          eligibleAmount += item.productVariant.price * item.quantity;
        }
      });
    }

    if (eligibleAmount === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Không có sản phẩm nào trong giỏ hàng đủ điều kiện áp dụng mã giảm giá này!');
    }

    let discountAmount = 0;
    if (voucher.discountType === 'fixed') {
      discountAmount = Math.min(voucher.discountValue, eligibleAmount);
    } else if (voucher.discountType === 'percentage') {
      discountAmount = (eligibleAmount * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, voucher.maxDiscountAmount);
      }
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công!',
      data: {
        voucherId: voucher._id,
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        subtotal,
        discountAmount,
        totalAmount: subtotal - discountAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteVoucher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const voucher = await VoucherModel.findByIdAndDelete(id);
    if (!voucher) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Mã giảm giá không tồn tại!');
    }
    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa mã giảm giá thành công!',
    });
  } catch (error) {
    next(error);
  }
};

export const VoucherController = {
  createVoucher,
  getAdminVouchers,
  updateVoucherStatus,
  updateVoucherLimits,
  getVoucherUsages,
  voidUsage,
  getActiveVouchers,
  applyVoucher,
  deleteVoucher,
};

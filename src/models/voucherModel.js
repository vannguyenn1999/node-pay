import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Voucher code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: [0, 'Discount value cannot be negative'],
    },
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 means no cap (only applicable for percentage type)
    },
    minOrderAmount: {
      type: Number,
      default: 0, // Minimum total billing amount required to use this voucher
    },
    scope: {
      type: String,
      enum: ['all', 'category', 'product', 'variant'],
      default: 'all',
    },
    applicableCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    applicableVariants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductVariant',
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      required: true, // Total voucher redemptions allowed globally
      default: 100,
    },
    usedCount: {
      type: Number,
      default: 0, // Total redemptions so far
    },
    limitPerUser: {
      type: Number,
      default: 1, // Max number of times a single user can redeem this voucher
    },
    allowedVipTiers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VipTier', // Empty array means open to all users
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

voucherSchema.index({ code: 1 }, { unique: true });
voucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const VoucherModel = mongoose.model('Voucher', voucherSchema);
export default VoucherModel;

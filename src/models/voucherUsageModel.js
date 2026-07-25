import mongoose from 'mongoose';

const voucherUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    discountApplied: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['applied', 'voided'],
      default: 'applied',
    },
    voidedAt: {
      type: Date,
      default: null,
    },
    voidedReason: {
      type: String,
      default: null,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

voucherUsageSchema.index({ user: 1, voucher: 1, bill: 1 }, { unique: true });
voucherUsageSchema.index({ user: 1, voucher: 1, status: 1 });

const VoucherUsageModel = mongoose.model('VoucherUsage', voucherUsageSchema);
export default VoucherUsageModel;

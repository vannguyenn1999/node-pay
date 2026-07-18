import mongoose from 'mongoose';

const vipTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    minSpent: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100,
    },
    color: {
      type: String,
      default: '#faad14',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const VipTierModel = mongoose.model('VipTier', vipTierSchema);

export default VipTierModel;

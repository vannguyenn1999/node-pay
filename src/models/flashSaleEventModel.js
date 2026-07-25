import mongoose from 'mongoose';

const flashSaleEventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Flash sale event name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
    },
    applicableCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null, // null means all categories are eligible
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

flashSaleEventSchema.index({ startTime: 1, endTime: 1, isActive: 1 });

const FlashSaleEventModel = mongoose.model('FlashSaleEvent', flashSaleEventSchema);
export default FlashSaleEventModel;

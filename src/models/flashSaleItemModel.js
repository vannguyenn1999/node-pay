import mongoose from 'mongoose';

const flashSaleItemSchema = new mongoose.Schema(
  {
    flashSaleEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashSaleEvent',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductVariant',
      required: true,
    },
    flashSalePrice: {
      type: Number,
      required: true,
      min: [0, 'Flash sale price cannot be negative'],
    },
    flashSaleStock: {
      type: Number,
      required: true,
      min: [0, 'Flash sale stock cannot be negative'],
    },
    soldCount: {
      type: Number,
      default: 0,
    },
    limitPerUser: {
      type: Number,
      default: 1, // Max items a user can purchase of this variant during the event
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

flashSaleItemSchema.index({ flashSaleEvent: 1, productVariant: 1 }, { unique: true });

const FlashSaleItemModel = mongoose.model('FlashSaleItem', flashSaleItemSchema);
export default FlashSaleItemModel;

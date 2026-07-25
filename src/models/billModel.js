import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
        required: true,
    },
    items: [
      {
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
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
        isFlashSale: {
          type: Boolean,
          default: false,
        },
        flashSaleItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FlashSaleItem',
          default: null,
        },
      },
    ],
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'bank_transfer'],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const BillModel = mongoose.model('Bill', billSchema);

export default BillModel;

import mongoose from 'mongoose';

const paySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
        required: true,
    },
    items : [
      { 
        quantity: {
          type: Number,
          required: true,
        },
        productVariant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
          required: true,
        },
        priceAtPurchase: {
          type: Number,
        },
        originalPrice: {
          type: Number,
        },
        isFlashSale: {
          type: Boolean,
          default: false,
        },
        flashSalePrice: {
          type: Number,
        },
        flashSaleItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'FlashSaleItem',
          default: null,
        },
      }
    ],
    orderCode : {
        type: String,
        required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    voucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null,
    },
    voucherDiscount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
        enum: ['PENDING', 'PAID', 'CANCELLED'],
        default: 'PENDING',
    },
    
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    info: {
      name: { type: String, trim: true },      
      phone: { type: String, trim: true },     
      address: { type: String, trim: true },        
      email: { type: String, trim: true },              
    },
    checkoutUrl :{
      type: String,
    },
    paymentLinkId: {
      type: String,
    },

  },
  { timestamps: true },
);

const PayModel = mongoose.model('Pay', paySchema);

export default PayModel;

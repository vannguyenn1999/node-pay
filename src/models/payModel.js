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

  },
  { timestamps: true },
);

const PayModel = mongoose.model('Pay', paySchema);

export default PayModel;

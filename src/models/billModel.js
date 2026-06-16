import mongoose from 'mongoose';

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
        required: true,
    },
    product: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        }
    ],
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

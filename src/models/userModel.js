import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Nên thêm để tránh trùng lặp email hoa/thường
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
    },
    phone : {
      type: String,
      required: false,
    },
    address : {
      type: String,
      required: false,
    },
    userImage : {
      type: String,
      required: false,
    },
    userImagePublicId : {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    refreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

const UserModel = mongoose.model('User', userSchema);

export default UserModel;

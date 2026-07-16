import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {StatusCodes} from "http-status-codes"

import { ENV } from '~/config/environment.js';
import UserModel from '~/models/userModel.js';
import { cloudinary } from '~/config/cloudinary.js';

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // Tìm người dùng trong cơ sở dữ liệu

    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Người dùng không tồn tại !' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Tài khoản của bạn đã bị khoá !' });
    }

    // Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không chính xác !' });
    }

    // Tạo access token (10h)
    const accessToken = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role },
      ENV.JWT_SECRET,
      { expiresIn: '10h' },
    );

    // Tạo refresh token (7 ngày)
    const refreshToken = jwt.sign(
      { id: user._id },
      ENV.JWT_SECRET,
      { expiresIn: '7d' },
    );

    // Lưu refresh token vào database
    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = {
      email: user.email,
      name: user.name,
      role: user.role,
      phone : user.phone,
      address : user.address,
      image : user.userImage
    };
    res.status(200).json({ user: userResponse, access: accessToken, refresh: refreshToken });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    console.log("req.body" , req.body)
    const { email, password, username , phone , address } = req.body;
    // Kiểm tra nếu người dùng đã tồn tại
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Tài khoản email đã tồn tại' });
    }
    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    // Tạo người dùng mới (mặc định role là 'user')
    const newUser = new UserModel({ email, password: hashedPassword, name : username, role: 'user' , address , phone , userImage : req.file ? req.file.path : null ,  userImagePublicId : req.file ? req.file.filename : null});
    await newUser.save();
    res.status(201).json({ status: 'success', message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await UserModel.findById(decoded.id).select('email').select('name').select('phone').select('address').select('userImage').select('role');
      res.status(200).json({ user }); // Trả về thông tin người dùng
    } catch (error) {
      res.status(401).json({ message: 'Invalid token', error });
    }
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token is required' });
    }

    try {
      // Xác minh refresh token
      const decoded = jwt.verify(token, ENV.JWT_SECRET);

      // Tìm người dùng và kiểm tra refresh token
      const user = await UserModel.findById(decoded.id);
      if (!user || user.refreshToken !== token) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      // Tạo access token mới
      const newAccessToken = jwt.sign(
        { id: user._id, email: user.email, name: user.name, role: user.role },
        ENV.JWT_SECRET,
        { expiresIn: '10h' },
      );

      res.status(200).json({ access: newAccessToken });
    } catch (error) {
      res.status(401).json({ message: 'Invalid refresh token', error });
    }
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req ,res , next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await UserModel.findById(decoded.id)
      if(!user){
        return res.status(401).json({ message: 'Người dùng không tồn tại !' });
      }

      const { email, username , phone , address } = req.body;
      if(email !== user.email){
        return res.status(401).json({ message: 'Người dùng không tồn tại !' });
      }

      if (user && req.file) {
      cloudinary.uploader.destroy(user.userImagePublicId, (error, result) => {
        if (error) {
          console.error('Error:', error);
        } else {
          console.log('Result:', result);
        }
      });
    }

      const dataUserUpdater = {
        name : username || user.name,
        phone : phone || user.phone,
        address : address || user.address,
        userImage: req.file ? req.file.path : user.userImage,
        userImagePublicId : req.file ? req.file.filename : user.userImagePublicId
      }
      const userUpdater = await UserModel.findByIdAndUpdate(user.id , dataUserUpdater,  { returnDocument: 'after', runValidators: true , select: 'email userImage address name phone'}, )
      console.log("userUpdater" , userUpdater)
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Cập nhật người dùng thành công !',
        data: userUpdater,
      });
    } catch (error) {
      res.status(401).json({ message: 'Lỗi cập nhật !', error });
    }

  } catch (error) {
    next(error)
  }
}

export const AuthController = {
  login,
  register,
  getProfile,
  refreshToken,
  updateUser
};

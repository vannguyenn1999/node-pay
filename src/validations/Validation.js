import { StatusCodes } from 'http-status-codes';
import Joi from 'joi';

// ? Validation cho login
const login = (req, res, next) => {
  try {
    const LoginSchema = Joi.object({
      email: Joi.string().required().min(3).max(30).trim().strict(),
      password: Joi.string().required().min(6).max(30).trim().strict(),
      name: Joi.string().optional().min(3).max(30).trim().strict(),
    });

    const { error } = LoginSchema.validate(req.body, { abortEarly: false }); // abortEarly: false để hiển thị tất cả lỗi thay vì dừng lại ở lỗi đầu tiên
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ status: 'FAILED', message: 'Tài khoản hoặc mật khẩu không đúng !' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// ? Validation cho register
const register = (req, res, next) => {
  try {
    const RegisterSchema = Joi.object({
      email: Joi.string().required().min(3).max(30).trim().strict(),
      password: Joi.string().required().min(6).max(30).trim().strict(),
      phone: Joi.string().optional().min(10).max(15).trim().strict(),
      username: Joi.string().required().min(6).max(30).trim().strict(),
      address : Joi.string().optional().min(3).max(30).trim().strict(),
      passwordConfirm: Joi.string()
        .required()
        .valid(Joi.ref('password')) // Kiểm tra khớp với trường 'password'
        .strict(),
    });
    const { error } = RegisterSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ status: 'FAILED', message: 'Thông tin đăng ký không hợp lệ' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const VALIDATIONS = {
  login,
  register,
};

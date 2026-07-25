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

const createVoucher = (req, res, next) => {
  try {
    const schema = Joi.object({
      code: Joi.string().required().uppercase().trim(),
      description: Joi.string().required(),
      discountType: Joi.string().valid('percentage', 'fixed').required(),
      discountValue: Joi.number().min(0).required(),
      maxDiscountAmount: Joi.number().min(0).optional(),
      minOrderAmount: Joi.number().min(0).optional(),
      scope: Joi.string().valid('all', 'category', 'product', 'variant').default('all'),
      applicableCategory: Joi.string().hex().length(24).optional(),
      applicableProducts: Joi.array().items(Joi.string().hex().length(24)).optional(),
      applicableVariants: Joi.array().items(Joi.string().hex().length(24)).optional(),
      startDate: Joi.date().iso().required(),
      endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
      usageLimit: Joi.number().integer().min(1).required(),
      limitPerUser: Joi.number().integer().min(1).default(1),
      allowedVipTiers: Joi.array().items(Joi.string().hex().length(24)).optional(),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Dữ liệu voucher không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const updateVoucherStatus = (req, res, next) => {
  try {
    const schema = Joi.object({
      isActive: Joi.boolean().required(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Trạng thái không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const updateVoucherLimits = (req, res, next) => {
  try {
    const schema = Joi.object({
      usageLimit: Joi.number().integer().min(1).optional(),
      limitPerUser: Joi.number().integer().min(1).optional(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Giới hạn không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const voidUsage = (req, res, next) => {
  try {
    const schema = Joi.object({
      reason: Joi.string().optional().max(200).trim(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Lý do không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const applyVoucher = (req, res, next) => {
  try {
    const schema = Joi.object({
      code: Joi.string().required().uppercase().trim(),
    });
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Mã voucher không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const createFlashSaleEvent = (req, res, next) => {
  try {
    const schema = Joi.object({
      name: Joi.string().required().trim(),
      description: Joi.string().optional().allow(''),
      startTime: Joi.date().iso().required(),
      endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
      status: Joi.string().valid('scheduled', 'active', 'ended', 'cancelled').default('scheduled'),
      applicableCategory: Joi.string().hex().length(24).optional().allow(null, ''),
      discountPercentage: Joi.number().min(0).max(100).optional().default(0),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Thông tin flash sale không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const addFlashSaleItem = (req, res, next) => {
  try {
    const schema = Joi.object({
      product: Joi.string().hex().length(24).required(),
      productVariant: Joi.string().hex().length(24).optional(),
      flashSalePrice: Joi.number().min(0).optional(),
      flashSaleStock: Joi.number().integer().min(1).required(),
      limitPerUser: Joi.number().integer().min(1).default(1),
      pricingMethod: Joi.string().valid('price', 'percentage').optional(),
      discountPercentage: Joi.number().min(0).max(100).optional(),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({ status: 'FAILED', message: 'Thông tin sản phẩm flash sale không hợp lệ', errors: error.details.map(d => d.message) });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const VALIDATIONS = {
  login,
  register,
  createVoucher,
  updateVoucherStatus,
  updateVoucherLimits,
  voidUsage,
  applyVoucher,
  createFlashSaleEvent,
  addFlashSaleItem,
};

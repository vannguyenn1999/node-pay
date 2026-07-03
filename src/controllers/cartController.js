import { StatusCodes } from 'http-status-codes';
import CartModel from '~/models/cartModel.js';

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let cart = await CartModel.findOne({ user: userId })
      .populate('items.product')
      .populate('items.productVariant');

    if (!cart) {
      cart = new CartModel({ user: userId, items: [] });
      await cart.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

const updateCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // Array of { product, productVariant, quantity }

    let cart = await CartModel.findOne({ user: userId });
    if (!cart) {
      cart = new CartModel({ user: userId, items: [] });
    }

    cart.items = items || [];
    await cart.save();

    // Populate updated cart to return to the frontend
    const populatedCart = await CartModel.findById(cart._id)
      .populate('items.product')
      .populate('items.productVariant');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cập nhật giỏ hàng thành công!',
      data: populatedCart
    });
  } catch (error) {
    next(error);
  }
};

export const CartController = {
  getCart,
  updateCart
};

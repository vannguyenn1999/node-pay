import { StatusCodes } from 'http-status-codes';
import FlashSaleEventModel from '~/models/flashSaleEventModel.js';
import FlashSaleItemModel from '~/models/flashSaleItemModel.js';
import ProductVariantModel from '~/models/productVariantModel.js';
import ApiError from '~/utils/ApiError.js';

// --- ADMIN CONTROLLERS ---

const createEvent = async (req, res, next) => {
  try {
    const { name, description, startTime, endTime, status, applicableCategory, discountPercentage } = req.body;

    const event = await FlashSaleEventModel.create({
      name,
      description,
      startTime,
      endTime,
      status: status || 'scheduled',
      applicableCategory: applicableCategory || null,
      discountPercentage: discountPercentage || 0,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Tạo sự kiện Flash Sale thành công!',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

const addFlashSaleItem = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { product, productVariant, flashSalePrice, flashSaleStock, limitPerUser, pricingMethod, discountPercentage } = req.body;

    // 1. Verify event exists
    const event = await FlashSaleEventModel.findById(eventId);
    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sự kiện Flash Sale!');
    }

    const createdItems = [];

    // 2. Determine target variants
    let variants = [];
    if (productVariant) {
      const variant = await ProductVariantModel.findById(productVariant);
      if (!variant) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy biến thể sản phẩm!');
      }
      if (variant.product.toString() !== product.toString()) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Biến thể sản phẩm không khớp với sản phẩm gốc!');
      }
      variants = [variant];
    } else {
      variants = await ProductVariantModel.find({ product });
      if (!variants || variants.length === 0) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy biến thể nào cho sản phẩm này!');
      }
    }

    // 3. Loop and create flash sale items for each variant
    const pct = discountPercentage !== undefined ? discountPercentage : (event.discountPercentage || 0);

    for (const variant of variants) {
      let finalPrice = flashSalePrice;
      if (pricingMethod === 'percentage' || (pricingMethod === undefined && pct > 0)) {
        finalPrice = Math.round((variant.price * (1 - pct / 100)) / 1000) * 1000;
      } else if (!finalPrice) {
        finalPrice = variant.price;
      }

      const flashSaleItem = await FlashSaleItemModel.findOneAndUpdate(
        { flashSaleEvent: eventId, productVariant: variant._id },
        {
          product,
          flashSalePrice: finalPrice,
          flashSaleStock,
          limitPerUser: limitPerUser || 1,
          isActive: true,
        },
        { new: true, upsert: true }
      );
      createdItems.push(flashSaleItem);
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Thêm sản phẩm vào Flash Sale thành công!',
      data: createdItems,
    });
  } catch (error) {
    next(error);
  }
};

const autoUpdateEventStatuses = async () => {
  const now = new Date();
  await FlashSaleEventModel.updateMany(
    { status: { $ne: 'cancelled' }, endTime: { $lt: now }, status: { $ne: 'ended' } },
    { $set: { status: 'ended' } }
  );
  await FlashSaleEventModel.updateMany(
    { status: { $ne: 'cancelled' }, startTime: { $lte: now }, endTime: { $gte: now }, status: { $ne: 'active' } },
    { $set: { status: 'active' } }
  );
  await FlashSaleEventModel.updateMany(
    { status: { $ne: 'cancelled' }, startTime: { $gt: now }, status: { $ne: 'scheduled' } },
    { $set: { status: 'scheduled' } }
  );
};

const getAdminEvents = async (req, res, next) => {
  try {
    await autoUpdateEventStatuses();

    const events = await FlashSaleEventModel.find({})
      .populate('applicableCategory', 'name')
      .sort({ startTime: -1 });
    res.status(StatusCodes.OK).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

const getAdminEventItems = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const items = await FlashSaleItemModel.find({ flashSaleEvent: eventId })
      .populate({
        path: 'product',
        select: 'name mainImage category serie',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'serie', select: 'name' },
        ],
      })
      .populate('productVariant', 'sku price storage color condition');

    res.status(StatusCodes.OK).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

// --- PUBLIC / USER CONTROLLERS ---

const getActiveFlashSales = async (req, res, next) => {
  try {
    await autoUpdateEventStatuses();
    const now = new Date();
    // Fetch scheduled or active flash sales that have not ended yet
    const events = await FlashSaleEventModel.find({
      isActive: true,
      endTime: { $gte: now },
      status: { $in: ['scheduled', 'active'] },
    }).sort({ startTime: 1 });

    const activeEventsWithItems = [];

    for (const event of events) {
      // Find items in this event
      const items = await FlashSaleItemModel.find({ flashSaleEvent: event._id, isActive: true })
        .populate('product', 'name mainImage slug')
        .populate('productVariant', 'sku price storage color condition originalPrice');

      activeEventsWithItems.push({
        event,
        items,
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: activeEventsWithItems,
    });
  } catch (error) {
    next(error);
  }
};

const getFlashSaleItemDetails = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const item = await FlashSaleItemModel.findById(itemId)
      .populate('product', 'name mainImage slug specifications')
      .populate('productVariant', 'sku price stock storage color condition originalPrice');

    if (!item || !item.isActive) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sản phẩm Flash Sale này!');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await FlashSaleEventModel.findByIdAndDelete(id);
    if (!event) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy sự kiện Flash Sale!');
    }
    // Delete all flash sale items related to this event
    await FlashSaleItemModel.deleteMany({ flashSaleEvent: id });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Xóa sự kiện Flash Sale thành công!',
    });
  } catch (error) {
    next(error);
  }
};

export const FlashSaleController = {
  createEvent,
  addFlashSaleItem,
  getAdminEvents,
  getAdminEventItems,
  getActiveFlashSales,
  getFlashSaleItemDetails,
  deleteEvent,
};

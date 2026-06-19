import {StatusCodes} from "http-status-codes"

import { cloudinary } from '~/config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import ProductVariantModel from '../models/productVariantModel.js';
import ProductModel from '../models/productModel.js';
import { convertName , removeVietnameseTones } from "~/utils/formartter.js";


const createProductVariant = async (req, res, next) => {
    try {
        const {product, storage , color , condition , region , price , originalPrice , stock} = req.body;
        const existingProduct = await ProductModel.findById(product);
        if (!existingProduct) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm gốc không tồn tại !');
        }
        const sku = `${convertName(existingProduct.name)}-${storage.toUpperCase()}-${removeVietnameseTones(color.split(' ')[0].toUpperCase())}-${condition.toUpperCase()}`;
        const bodyData = {
            product: product,
            sku : sku, 
            storage:storage,
            color:color,
            condition : condition,
            region: region,
            price : price,
            originalPrice : originalPrice,
            stock : stock,
            imageColor: req.file ? req.file.path : null,
            imageColorPublicId: req.file ? req.file.filename : null,
        };
        const newProductVariant = await ProductVariantModel.create(bodyData);
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: newProductVariant,
            message: 'Tạo biến thể sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const getProductVariantDetail = async (req, res, next) => {
    try {
        const { productSlug } = req.params;
        const product = await ProductModel.findOne({ slug: productSlug, isActive: true })
        .populate('category', 'name slug')
        .populate('serie', 'name slug');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const variants = await ProductVariantModel.find({ product: product._id, isActive: true });
        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                info: product,       
                variants: variants  
            },
            message: 'Lấy thông tin biến thể sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const updateProductVariant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { storage, color, condition, region ,price,  originalPrice , stock } = req.body;
        const product = await ProductVariantModel.findById(id);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }   
        product.storage = storage || product.storage;
        product.color = color || product.color;
        product.price = price || product.price;
        product.condition = condition || product.condition;
        product.region = region || product.region;
        product.originalPrice = originalPrice || product.originalPrice;
        product.region = stock || product.stock;
        await product.save();
        res.status(StatusCodes.OK).json({
            success: true,
            data: product,
            message: 'Cập nhật sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const deleteProductVariant = async (req, res, next) => {
    try {
        const { id } = req.params;
        const productVariant = await ProductVariantModel.findById(id);
        if (!productVariant) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Biến thể sản phẩm không tồn tại !');
        }
        try {
            if (productVariant.imagesPublicId && productVariant.imagesPublicId.length > 0) {
                cloudinary.uploader.destroy(productVariant.imagesPublicId, (error, result) => {
                    if (error) {
                        console.error('Error:', error);
                    } else {
                        console.log('Result:', result);
                    }
            });
            }
        } catch (error) {
            console.log("error : " , error)
        }
        await productVariant.remove();
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Xóa sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}


export const ProductVariantController = {
    createProductVariant,
    getProductVariantDetail,
    deleteProductVariant,
    updateProductVariant,
}
import {StatusCodes} from "http-status-codes"

import { cloudinary } from '~/config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import ProductVariantModel from '../models/productVariantModel.js';
import ProductModel from '../models/productModel.js';
import SerieModel from "~/models/serieModel.js";
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

const getAllProductVariant = async (req, res, next) => {
    try {
        const search = req.query.search || '';

        let productFilter = {};
        if (search.trim()) {
            const products = await ProductModel.find({
                name: { $regex: search, $options: 'i' },
                isActive: true,
            }).select('_id');

            productFilter = {
                product: { $in: products.map((product) => product._id) },
            };
        }

        const variants = await ProductVariantModel.find({
            ...productFilter,
            isActive: true,
        })
            .populate({
                path: 'product',
                select: 'name slug mainImage serie',
                populate: {
                    path: 'serie',
                    select: 'name slug',
                },
            })
            .sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({
            success: true,
            data: variants,
            message: 'Lấy danh sách biến thể sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
};

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

const getProductVariantBySerie = async (req, res, next) => {
    try {
        const { serieSlug } = req.params;

        const series = await SerieModel.findOne({
            slug: serieSlug,
            isActive: true,
        }).select('_id name slug');

        if (!series) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy series nào !',
            });
        }

        const products = await ProductModel.find({
            serie: series._id,
            isActive: true,
        }).select('_id name slug mainImage');

        const productIds = products.map((product) => product._id);

        const variants = await ProductVariantModel.find({
            product: { $in: productIds },
            isActive: true,
        })
            .populate({
                path: 'product',
                select: 'name slug mainImage serie',
                populate: {
                    path: 'serie',
                    select: 'name slug',
                },
            })
            .sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                serie: series,
                variants,
                pagination : {
                    total : variants.length
                }
            },
            message: 'Lấy danh sách biến thể theo series thành công !',
        });
    } catch (error) {
        next(error);
    }
};


export const ProductVariantController = {
    createProductVariant,
    getAllProductVariant,
    getProductVariantDetail,
    deleteProductVariant,
    updateProductVariant,
    getProductVariantBySerie,
};
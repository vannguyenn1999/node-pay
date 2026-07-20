import { StatusCodes } from "http-status-codes"

import { cloudinary } from '~/config/cloudinary.js';
import ApiError from '../utils/ApiError.js';
import ProductVariantModel from '../models/productVariantModel.js';
import ProductModel from '../models/productModel.js';
import SerieModel from "~/models/serieModel.js";
import { convertName, removeVietnameseTones } from "~/utils/formartter.js";
import CategoryModel from "~/models/categoryModel.js";


// ? tạo mới 1 biến thể sản phầm
const createProductVariant = async (req, res, next) => {
    try {
        const { productMainId, storage, color, condition, region, price, originalPrice, stock } = req.body;
        const existingProduct = await ProductModel.findById(productMainId);
        if (!existingProduct) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm gốc không tồn tại !');
        }
        const sku = `${convertName(existingProduct.name)}-${storage.toUpperCase()}-${removeVietnameseTones(color.split(' ')[0].toUpperCase())}-${condition.toUpperCase()}`;
        const bodyData = {
            product: productMainId,
            sku: sku,
            storage: storage,
            color: color,
            condition: condition,
            region: region,
            price: price,
            originalPrice: originalPrice,
            stock: stock,
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

// ? Lấy tất cả biến thể của sản phẩm
const getAllProductVariant = async (req, res, next) => {
    try {
        const search = req.query.search || '';
        const page = req.query.p || req.query.page || 1;
        const limit = req.query.l || req.query.limit || 8;
        const skip = (page - 1) * limit;
        const sortType = req.query.sort || 'newest';
        const series = req.query.series || '';
        const activeParam = req.query.active;

        const role = (req.query.role || req.query.r || '').toString().trim().toLowerCase();
        const isAdmin = role === 'admin';
        let activeFilter = {};

        if (isAdmin) {
            if (activeParam === 'true' || activeParam === 'false') {
                activeFilter = { isActive: activeParam === 'true' };
            }
        } else {
            activeFilter = { isActive: true };
        }

        let productFilter = {};
        let productQuery = {
            ...activeFilter,
        };

        if (series) {
            const seriesDoc = await SerieModel.findOne({
                $or: [
                    { _id: series },
                    { slug: series },
                ],
                isActive: true,
            }).select('_id');

            if (seriesDoc) {
                productQuery = {
                    ...productQuery,
                    serie: seriesDoc._id,
                };
            }
        }

        if (search.trim()) {
            productQuery = {
                ...productQuery,
                name: { $regex: search, $options: 'i' },
            };
        }

        const products = await ProductModel.find(productQuery).select('_id');
        productFilter = {
            product: { $in: products.map((product) => product._id) },
        };

        // Đếm tổng số biến thể sản phẩm sau khi áp dụng filter (search, isActive, series)
        const totalVariants = await ProductVariantModel.countDocuments({
            ...productFilter,
            ...activeFilter,
        });

        const sortOption = sortType === 'price_asc'
            ? { price: 1 }
            : sortType === 'price_desc'
                ? { price: -1 }
                : { createdAt: -1 };

        const variants = await ProductVariantModel.find({
            ...productFilter,
            ...activeFilter,
        }).limit(limit).skip(skip)
            .populate({
                path: 'product',
                select: 'name slug mainImage serie',
                populate: {
                    path: 'serie',
                    select: 'name slug',
                },
            })
            .sort(sortOption);

        const totalPages = Math.ceil(totalVariants / limit);
        res.status(StatusCodes.OK).json({
            success: true,
            data: variants,
            pagination: {
                currentPage: Number(page),
                totalPages,
                totalVariants,
                limit: Number(limit),
            },
            message: 'Lấy danh sách biến thể sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
};

// ? Lấy thông tin biến thể của 1 sản phẩm
const getProductVariant = async (req, res, next) => {
    try {
        const { productSlug } = req.params;
        const product = await ProductModel.findOne({ slug: productSlug, isActive: true })
            .populate('category', 'name slug')
            .populate('serie', 'name slug');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const variants = await ProductVariantModel.find({ product: product._id, isActive: true })
            .populate('product');
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

// ? Cập nhật biến thể sản phầm
const updateProductVariant = async (req, res, next) => {
    try {
        const { productSlug } = req.params;
        const { storage, color, condition, region, price, originalPrice, stock , isActive , productMainId } = req.body;
        let skuName = '';

        const product = await ProductVariantModel.findById(productSlug);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }
        if(productMainId) {
            const existingProduct = await ProductModel.findById(productMainId);
            if (!existingProduct) {
                throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm gốc không tồn tại !');
            }
            skuName = existingProduct.name
            product.product = productMainId;
        }else {
            const existingProduct1 = await ProductModel.findById(product.product);
            skuName = existingProduct1.name
        }
        if(req.file) {
            if (product.imageColorPublicId) {
                cloudinary.uploader.destroy(product.imageColorPublicId, (error, result) => {
                    if (error) {
                        console.error('Error:', error);
                    } else {
                        console.log('Result:', result);
                    }
                });
            }
        }
        
        if(storage) product.storage = storage;
        if(color) product.color = color;
        if(condition) product.condition = condition;
        if(region) product.region = region;
        if(price) product.price = price;
        if(originalPrice) product.originalPrice = originalPrice;
        if(stock) product.stock = stock;
        if(storage || color || condition) product.sku = `${convertName(skuName)}-${storage.toUpperCase()}-${removeVietnameseTones(color.split(' ')[0].toUpperCase())}-${condition.toUpperCase()}`;
        product.isActive = isActive !== undefined ? isActive : product.isActive;
        product.imageColor = req.file ? req.file.path : product.imageColor;;
        product.imageColorPublicId = req.file ? req.file.filename : product.imageColorPublicId;
        console.log("product" , product)
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

// ? Xoá biến thể sản phầm
const deleteProductVariant = async (req, res, next) => {
    try {
        const { productSlug } = req.params;
        console.log("first" , productSlug)
        const productVariant = await ProductVariantModel.findById(productSlug);
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

            if (productVariant.imageColorPublicId) {
                cloudinary.uploader.destroy(productVariant.imageColorPublicId, (error, result) => {
                    if (error) {
                        console.error('Error:', error);
                    } else {
                        console.log('Result:', result);
                    }
                });
            }
        } catch (error) {
            console.log("error : ", error)
        }
        
        await ProductVariantModel.findByIdAndDelete(productSlug);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Xóa sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

// ? Tìm kiếm biến thể sản phẩm thông qua series và danh mục sản phẩm
const getProductVariantBySerie = async (req, res, next) => {
    try {
        const { serieSlug, categorySlug } = req.params;
        // console.log(serieSlug , categorySlug)

        const series = await SerieModel.findOne({
            slug: serieSlug,
            isActive: true,
        }).select('_id name slug');


        const category = await CategoryModel.findOne({
            slug: categorySlug,
            isActive: true,
        }).select('_id name slug');

        // console.log(series , category)
        if (!series || !category) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy series nào !',
            });
        }

        const products = await ProductModel.find({
            serie: series._id,
            category: category._id,
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
                category: category,
                variants,
                pagination: {
                    total: variants.length
                }
            },
            message: 'Lấy danh sách biến thể theo series thành công !',
        });
    } catch (error) {
        next(error);
    }
};


// ? Lấy thông tin chi tiết của 1 sản phẩm
const getProductVariantDetail = async (req, res, next) => {
    try {
        const sku = req.params.sku
        if (!sku) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const variant = await ProductVariantModel.findOne({ sku: sku })

        if (!variant) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const product = await ProductModel.findById(variant.product)

        // console.log("variant" , variant)
        res.status(200).json({
            success: true,
            product,
            variant,
            message: 'Tìm kiếm thông tin sản phầm thành công !'
        })
    } catch (error) {
        next(error)
    }
}

export const ProductVariantController = {
    createProductVariant,
    getAllProductVariant,
    getProductVariant,
    deleteProductVariant,
    updateProductVariant,
    getProductVariantBySerie,
    getProductVariantDetail
};
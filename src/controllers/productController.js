import {StatusCodes} from "http-status-codes"

import { slugify, randomStringSecure } from '~/utils/formartter';
import { cloudinary } from '~/config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import ProductModel from '../models/productModel.js';

// ? Hàm lấy danh sách sản phẩm, hỗ trợ tìm kiếm theo từ khóa (search), phân trang (page, limit) và lọc theo slug
const getAllProducts = async (req, res, next) => {
    try {
        const search = req.query.search || ""
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const slug = slugify(search)

        const filter = {};
        if (search !== "") {
            const slug = slugify(search)
            filter.slug = { $regex: slug, $options: 'i' };
        }

        const products = await ProductModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).select('-mainImagePublicId -imagesPublicId').populate('category', 'name -_id').populate('serie', 'name -_id');
        const totalProducts = await ProductModel.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limit);
        res.status(StatusCodes.OK).json({
            success: true,
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts,
                limit,
            },
        });
    } catch (error) {
        next(error);
    }
}

// ? Hàm tạo sản phẩm mới, đồng thời upload ảnh lên Cloudinary và lưu public_id để quản lý
const createProduct = async (req, res, next) => {
    try {
        const { name, description, specifications , category , serie } = req.body;
        const bodyData = {
            category: category,
            serie : serie, 
            name: name,
            description : description ,
            mainImage: req.files['mainImage'] ? req.files['mainImage'][0].path : null,
            images : req.files['images'] ? req.files['images'].map(file => file.path) : null,

            mainImagePublicId : req.files['mainImage'] ? req.files['mainImage'][0].filename : null,
            imagesPublicId: req.files['images'] ? req.files['images'].map(file => file.filename) : null,
            specifications : specifications ? JSON.parse(specifications) : {}, // Chuyển specifications từ chuỗi JSON sang đối tượng
            // slug: `${slugify(name)}-${randomStringSecure()}`,
            slug: `${slugify(name)}`,
        };
        const newProduct = await ProductModel.create(bodyData);
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: newProduct,
            message: 'Tạo sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

// ? Hàm lấy thông tin chi tiết sản phẩm theo ID, đồng thời populate thông tin category và serie
const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;  
        const product = await ProductModel.findById(id).populate('category', 'name').populate('serie', 'name');
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }
        res.status(StatusCodes.OK).json({
            success: true,
            data: product,
            message: 'Lấy thông tin sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

// ? Hàm cập nhật thông tin sản phẩm theo ID, đồng thời hỗ trợ cập nhật ảnh và public_id trên Cloudinary
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            category,
            serie,
            specifications,
            deleteImagePublicIds,
            deleteImageUrls,
        } = req.body;

        const product = await ProductModel.findById(id);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }

        if (name) {
            product.name = name;
            product.slug = slugify(name);
        }
        if (description) product.description = description;
        if (category) product.category = category;
        if (serie) product.serie = serie;
        if (specifications) {
            product.specifications = typeof specifications === 'string'
                ? JSON.parse(specifications)
                : specifications;
        }

        const parseArray = (value) => {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            try {
                return JSON.parse(value);
            } catch {
                return [value];
            }
        };

        const imagesToKeepPublicIds = parseArray(deleteImagePublicIds).map(String);
        const imagesToKeepUrls = parseArray(deleteImageUrls).map(String);

        const remainingImages = [];
        const remainingPublicIds = [];
        const oldImages = Array.isArray(product.images) ? product.images : [];
        const oldPublicIds = Array.isArray(product.imagesPublicId) ? product.imagesPublicId : [];
        const maxOldLength = Math.max(oldImages.length, oldPublicIds.length);

        const shouldKeepImage = (publicId, imageUrl) => {
            if (imagesToKeepPublicIds.length === 0 && imagesToKeepUrls.length === 0) {
                return true;
            }
            return imagesToKeepPublicIds.includes(publicId) || imagesToKeepUrls.includes(imageUrl);
        };

        for (let index = 0; index < maxOldLength; index += 1) {
            const publicId = String(oldPublicIds[index] || '');
            const imageUrl = String(oldImages[index] || '');
            const keepImage = shouldKeepImage(publicId, imageUrl);

            if (keepImage) {
                if (imageUrl) remainingImages.push(imageUrl);
                if (publicId) remainingPublicIds.push(publicId);
            } else if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.error('Cloudinary destroy error on image update:', error, publicId);
                }
            }
        }

        if (req.files?.mainImage?.length > 0) {
            const mainImageFile = req.files.mainImage[0];
            if (product.mainImagePublicId) {
                try {
                    await cloudinary.uploader.destroy(product.mainImagePublicId);
                } catch (error) {
                    console.error('Cloudinary destroy error on mainImage update:', error, product.mainImagePublicId);
                }
            }
            product.mainImage = mainImageFile.path;
            product.mainImagePublicId = mainImageFile.filename;
        }

        if (req.files?.images?.length > 0) {
            req.files.images.forEach((file) => {
                remainingImages.push(file.path);
                remainingPublicIds.push(file.filename);
            });
        }

        product.images = remainingImages;
        product.imagesPublicId = remainingPublicIds;

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

// ? Hàm xóa sản phẩm, đồng thời xóa các ảnh liên quan trên Cloudinary
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }
        // Delete Cloudinary assets for the product
        const publicIds = [];
        if (product.mainImagePublicId) publicIds.push(product.mainImagePublicId);
        if (Array.isArray(product.imagesPublicId) && product.imagesPublicId.length) {
            publicIds.push(...product.imagesPublicId);
        }

        try {
            await Promise.all(publicIds.map(async (publicId) => {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (error) {
                    console.error('Cloudinary destroy error:', error, publicId);
                }
            }));
        } catch (error) {
            console.error('Error deleting Cloudinary assets:', error);
        }

        await ProductModel.findByIdAndDelete(id);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Xóa sản phẩm thành công !',
        });
    } catch (error) {
        next(error);
    }
}

export const ProductController = {
    getAllProducts,
    createProduct,
    getProductById,
    deleteProduct,
    updateProduct,
}
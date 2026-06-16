import {StatusCodes} from "http-status-codes"

import { slugify, randomStringSecure } from '~/utils/formartter';
import { cloudinary } from '~/config/cloudinary.js';
import { ApiError } from '../utils/ApiError.js';
import ProductModel from '../models/productModel.js';

const getAllProducts = async (req, res, next) => {
    try {
        const search = req.query.search || ""
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const slug = slugify(search)
        const products = await ProductModel.find({slug : { $regex: slug, $options: 'i' }}).sort({ updatedAt: -1 }).skip(skip).limit(limit).select('-imagePublicId').populate('category', 'name -_id').populate('serie', 'name -_id');
        const totalProducts = await ProductModel.countDocuments();
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

const createProduct = async (req, res, next) => {
    try {
        const { name, description, specifications , category , serie } = req.body;
        const bodyData = {
            category: category,
            serie : serie, 
            name: name,
            description : description ,
            mainImage: req.file ? req.file.path : null,
            mainImagePublicId: req.file ? req.file.filename : null,
            specifications : specifications ? JSON.parse(specifications) : {}, // Chuyển specifications từ chuỗi JSON sang đối tượng
            slug: `${slugify(name)}-${randomStringSecure()}`,
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

const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, price, imageUrl, category } = req.body;
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }   
        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.imageUrl = imageUrl || product.imageUrl;
        product.category = category || product.category;
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

const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        if (!product) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Sản phẩm không tồn tại !');
        }
        try {
            if (product.imagePublicId) {
                cloudinary.uploader.destroy(product.imagePublicId, (error, result) => {
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
        await product.remove();
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
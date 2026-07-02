import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import CategoryModel from '~/models/categoryModel.js';

import { slugify, randomStringSecure } from '~/utils/formartter';

const getAllCategories = async (req , res , next) => {
    try {
        const filter = {};
        const { isActive } = req.query;
        if (isActive) {
            filter.isActive = isActive === 'true';
        }
        const categories = await CategoryModel.find(filter);
        res.status(StatusCodes.OK).json({
            success: true,
            data: categories,
            message: 'Lấy danh sách danh mục thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const createCategory = async (req , res , next) => {
    try {
        console.log("req.body" , req.body)
        const  { name  , description , isActive } = req.body;
        const newCategory = await CategoryModel.create({ name , description , isActive , slug: `${slugify(name)}` });
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: newCategory,
            message: 'Tạo danh mục thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const getCategoryById = async (req , res , next) => {
    try {
        const { id } = req.params; 
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Danh mục không tồn tại !');
        }
        res.status(StatusCodes.OK).json({
            success: true,
            data: category,
            message: 'Lấy thông tin danh mục thành công !',
        });
    } catch (error) {
        next(error);
    }

}

const updateCategory = async (req , res , next) => {
    try {
        const { id } = req.params; 
        const { name , description , isActive } = req.body;
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Danh mục không tồn tại !');
        }
        category.name = name || category.name;
        category.description = description || category.description;
        category.isActive = typeof isActive !== 'undefined' ? isActive : category.isActive;
        await category.save();

        res.status(StatusCodes.OK).json({
            success: true,
            data: category,
            message: 'Cập nhật danh mục thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const deleteCategory = async (req , res , next) => {
    try {
        const { id } = req.params;
        const deletedCategory = await CategoryModel.findByIdAndDelete(id);
        if (!deletedCategory) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Danh mục không tồn tại !');
        }
        res.status(StatusCodes.OK).json({
        success: true,
        message: 'Xóa danh mục thành công !',
        });
    } catch (error) {
        next(error);
    }
}

export const  CategoryController = {
    getAllCategories,
    createCategory,
    getCategoryById,
    updateCategory,
    deleteCategory
}
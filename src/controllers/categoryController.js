import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import CategoryModel from '~/models/categoryModel.js';

import { slugify, randomStringSecure } from '~/utils/formartter';

const getAllCategories = async (req , res , next) => {
    try {
        const categories = await CategoryModel.find();
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
        const  { name  , description } = req.body;
        const newCategory = await CategoryModel.create({ name , description , slug: `${slugify(name)}-${randomStringSecure()}` });
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
        const { name , description } = req.body;
        const category = await CategoryModel.findById(id);
        if (!category) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Danh mục không tồn tại !');
        }
        category.name = name || category.name;
        category.description = description || category.description;
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
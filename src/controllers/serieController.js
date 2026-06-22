import { StatusCodes } from 'http-status-codes';
import ApiError from '~/utils/ApiError.js';
import SerieModel from '~/models/serieModel.js';

import { slugify, randomStringSecure } from '~/utils/formartter';

const getAllSeries = async (req , res , next) => {
    try {
        const series = await SerieModel.find();
        res.status(StatusCodes.OK).json({
            success: true,
            data: series,
            message: 'Lấy danh sách seri thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const createSerie = async (req , res , next) => {
    try {
        const  { name  , description } = req.body;
        const newSerie = await SerieModel.create({ name , description , slug: `${slugify(name)}}` });
        res.status(StatusCodes.CREATED).json({
            success: true,
            data: newSerie,
            message: 'Tạo seri thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const getSerieById = async (req , res , next) => {
    try {
        const { id } = req.params; 
        const serie = await SerieModel.findById(id);
        if (!serie) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Seri không tồn tại !');
        }
        res.status(StatusCodes.OK).json({
            success: true,
            data: serie,
            message: 'Lấy thông tin seri thành công !',
        });
    } catch (error) {
        next(error);
    }

}

const updateSerie = async (req , res , next) => {
    try {
        const { id } = req.params; 
        const { name , description } = req.body;
        const serie = await SerieModel.findById(id);
        if (!serie) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Seri không tồn tại !');
        }
        serie.name = name || serie.name;
        serie.description = description || serie.description;
        await serie.save();

        res.status(StatusCodes.OK).json({
            success: true,
            data: serie,
            message: 'Cập nhật seri thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const deleteSerie = async (req , res , next) => {
    try {
        const { id } = req.params;
        const deletedSerie = await SerieModel.findByIdAndDelete(id);
        if (!deletedSerie) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Seri không tồn tại !');
        }
        res.status(StatusCodes.OK).json({
        success: true,
        message: 'Xóa seri thành công !',
        });
    } catch (error) {
        next(error);
    }
}

export const  SerieController = {
    getAllSeries,
    createSerie,
    getSerieById,
    updateSerie,
    deleteSerie
}
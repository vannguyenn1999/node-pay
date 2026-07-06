import { StatusCodes } from 'http-status-codes';

import ProductVariantModel from '~/models/productVariantModel.js';
import ProductModel from '~/models/productModel.js';
import PayModel from '~/models/payModel.js';
import PAYOSSS from '~/config/payos';

// ? Tạo 1 thanh toán mới
const createPayment = async (req , res , next) => {
    try {
        let amount = 0
        const items = []
        const order = req.body.orders;
        const infoUser = req.body.user
      
        // Tính tổng số tiền từ các mặt hàng trong đơn hàng
        for (const item of order) {
           const productVariant = await ProductVariantModel.findById(item.variantId).select('price stock sku product');
           if (!productVariant) {
               return res.status(StatusCodes.NOT_FOUND).json({
                   success: false,
                   message: 'Sản phẩm không tồn tại!'
               });
           }

           const product = await ProductModel.findById(productVariant.product).select('name');
         
           if (productVariant.stock < item.quantity) {
               return res.status(StatusCodes.BAD_REQUEST).json({
                   success: false,
                   message: 'Số lượng sản phẩm trong kho không đủ!'
               });
           }

           amount += productVariant.price * item.quantity;
           items.push({
                name: product.name,
                quantity: item.quantity,
                price: productVariant.price
           });
        }
        
        const orderCode = Date.now(); // Mã đơn hàng phải là số (int) và không trùng lặp
        const paymentData = {    
            orderCode: orderCode,
            amount: amount, // Số tiền (VND)
            // amount: 2000, // Số tiền (VND)
            description: `TT đơn hàng #${orderCode}`,
            returnUrl: 'https://react-pay-gamma.vercel.app/', // URL khi user hủy thanh toán 
            cancelUrl: 'http://localhost:8080/api/v1/pays/cancel-payment', // URL khi thanh toán xong
            items: items,
        };
        
        const payUrl = await PAYOSSS.paymentRequests.create(paymentData);
        if (!payUrl) {
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Tạo thanh toán thất bại!'
            });
        }
        const newPay = {
            user: req.user.id,
            items: order.map(item => {return { productVariant: item.variantId, quantity: item.quantity }}),
            totalAmount: amount,
            orderCode: orderCode,
            info : infoUser
        }
        const pay = new PayModel(newPay);
        await pay.save();
        res.status(StatusCodes.OK).json({
            success: true,
            data: payUrl,
            message: 'Tạo thanh toán thành công !',
        });
        
    } catch (error) {
        next(error);
    }
}

// ? Lấy thông tin thanh toán theo orderCode
const getPayment = async (req , res , next) => {
    try {
        const { orderCode } = req.params;
        const paymentInfo = await PAYOSSS.paymentRequests.get(orderCode);
        res.status(StatusCodes.OK).json({
            success: true,
            data: paymentInfo,
            message: 'Lấy thông tin thanh toán thành công !',
        });
    }catch (error) {
        next(error);
    }
}


// ? Xử lý webhook từ PayO SSS
const handleWebhook = async (req , res , next) => {
    try {
        const webhookData = req.body;
        console.log("webhookData" , webhookData)
        if(!webhookData) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Dữ liệu webhook không hợp lệ !',
            }); 
        }

        const orderCode = webhookData.data.orderCode;
        const paymentInfo = await PayModel.findOne({ orderCode: orderCode });
        if (!paymentInfo) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy thông tin thanh toán !',
            });
        }

        // Xử lý dữ liệu webhook ở đây (ví dụ: cập nhật trạng thái đơn hàng trong cơ sở dữ liệu)
        const verifiedData = await PAYOSSS.webhooks.verify(webhookData);
        console.log("verifiedData" , verifiedData)
        if (verifiedData.desc == 'success' && verifiedData.code === '00') {
            paymentInfo.status = 'PAID';
            await paymentInfo.save();
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Webhook nhận thành công !',
        });
    } catch (error) {
        next(error);
    }
}

const getPaymentHistoryDetail = async (req , res , next) => {
    const { orderCode } = req.params;
    try {
        const userId = req.user.id;
        const paymentHistoryDetail = await PayModel.findOne({ user: userId, orderCode: orderCode }).populate({
            path: 'items.productVariant',
            select: 'sku price color storage imageColor product condition',
            populate: {
                path: 'product',
                select: 'name slug mainImage'
            }
        });
        res.status(StatusCodes.OK).json({
            success: true,
            data: paymentHistoryDetail,
            message: 'Lấy thông tin lịch sử đơn hàng thành công !',
        });
    } catch (error) {
        next(error);
    }
}

// ? Lấy thông tin lịch sử đơn hàng của người dùng
const getPaymentHistory = async (req , res , next) => {
    try {
        const userId = req.user.id;
        const paymentHistory = await PayModel.find({ user: userId }).sort({ createdAt: -1 });

        res.status(StatusCodes.OK).json({
            success: true,
            data: paymentHistory,
            message: 'Lấy thông tin lịch sử đơn hàng thành công !',
        });
    }catch (error) {
        next(error);
    }
}

// ? Xử lý hoá đơn bị huỷ hoặc thanh toán thất bại (nếu cần thiết)
const handlePaymentFailure = async (req , res , next) => {
    try {
        // console.log("req" , req.query)
        const { orderCode , status , cancel } = req.query;
        if (!orderCode || !status) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Thiếu thông tin cần thiết !',
            });
        }
        if (status === 'CANCELLED') {
            const paymentInfo = await PayModel.findOne({ orderCode: orderCode });
            if (!paymentInfo) {
                return res.status(StatusCodes.NOT_FOUND).json({
                    success: false,
                    message: 'Không tìm thấy thông tin thanh toán !',
                });
            }
            paymentInfo.status = 'CANCELLED';
            await paymentInfo.save();
            return res.status(StatusCodes.OK).json({
            success: true,
            message: 'Hoá đơn đã bị huỷ thành công !',
        });
        }
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Hoá đơn đã bị huỷ hoặc thanh toán thất bại !',
        });
    }catch (error) {
        console.error('Lỗi khi xử lý hoá đơn thất bại:', error);
        next(error);
    }
}

export const PayController = {
    createPayment,
    handleWebhook,
    getPayment,
    getPaymentHistory,
    getPaymentHistoryDetail,
    handlePaymentFailure
}
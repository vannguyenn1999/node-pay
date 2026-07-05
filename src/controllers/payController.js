import { StatusCodes } from 'http-status-codes';

import ProductVariantModel from '~/models/productVariantModel.js';
import ProductModel from '~/models/productModel.js';
import PAYOSSS from '~/config/payos';


const createPayment = async (req , res , next) => {
    try {
        let amount = 0
        const items = []
        const order = req.body.orders;
        // const infoUser = req.body.user
      
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
            description: `TT đơn hàng #${orderCode}`,
            cancelUrl: 'https://react-pay-gamma.vercel.app/', // URL khi user hủy thanh toán
            returnUrl: 'https://react-pay-gamma.vercel.app/', // URL khi thanh toán xong
            items: items,
        };
        
        const payUrl = await PAYOSSS.paymentRequests.create(paymentData);
        res.status(StatusCodes.OK).json({
            success: true,
            data: payUrl,
            message: 'Tạo thanh toán thành công !',
        });
        
    } catch (error) {
        next(error);
    }
}

const handleWebhook = async (req , res , next) => {
    try {
        const webhookData = req.body;
        console.log("webhookData" , webhookData)
        // Xử lý dữ liệu webhook ở đây (ví dụ: cập nhật trạng thái đơn hàng trong cơ sở dữ liệu)
        const verifiedData = PAYOSSS.verifyPaymentWebhookData(webhookData);

        if (verifiedData.code === '00') {
            const orderId = verifiedData.orderCode;
            // TODO: Cập nhật trạng thái đơn hàng thành "Đã thanh toán" trong DB tại đây
            console.log(`Đơn hàng ${orderId} đã thanh toán thành công!`);
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Webhook nhận thành công !',
        });
    } catch (error) {
        next(error);
    }
}

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
export const PayController = {
    createPayment,
    handleWebhook,
    getPayment
}
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

import { ENV } from './environment.js';

// 1. Cấu hình SDK
cloudinary.config({
  cloud_name: ENV.CLOUD_NAME,
  api_key: ENV.API_KEY,
  api_secret: ENV.API_SECRET,
});

// 2. Cấu hình Storage để upload trực tiếp lên Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Pay', // Thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'], // Định dạng cho phép
    public_id: (req, file) => {
      // Tùy chỉnh public_id: dùng tên từ req.body.filename hoặc tên file gốc
      const customName =
        req.body.filename ||
        req.body.fileName ||
        file.originalname.split('.')[0].trim().replaceAll(' ', '_');
      // console.log("customName customName : " , customName)
      return `${customName}-${Date.now()}`;
    },
    resource_type: 'auto',
  },
});

;

export const uploadCloud = multer({ storage });

export { cloudinary }; 

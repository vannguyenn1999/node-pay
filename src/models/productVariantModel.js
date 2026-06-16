import mongoose from 'mongoose';

const ProductVariantSchema = new mongoose.Schema({
  // 1. LIÊN KẾT: Kết nối biến thể này với một Sản phẩm cụ thể (Ví dụ: iPhone 15 Pro Max)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Biến thể phải thuộc về một sản phẩm gốc']
  },

  // 2. MÃ QUẢN LÝ KHO (SKU): Mã duy nhất để định danh phiên bản
  // Ví dụ: IP15PM-256GB-TITAN-99 (iPhone 15 Pro Max - 256GB - Màu Titan - Máy 99%)
  sku: {
    type: String,
    required: [true, 'Vui lòng nhập mã SKU cho biến thể'],
    unique: true,
    trim: true,
    uppercase: true
  },

  // 3. CÁC THUỘC TÍNH PHÂN LOẠI (Yêu cầu của bạn)
  storage: {
    type: String,
    required: [true, 'Vui lòng nhập dung lượng (Ví dụ: 128GB, 256GB...)'],
    trim: true
  },
  
  color: {
    type: String,
    required: [true, 'Vui lòng nhập màu sắc (Ví dụ: Titan Tự Nhiên, Đen...)'],
    trim: true
  },

  condition: {
    type: String,
    required: [true, 'Vui lòng chọn tình trạng máy'],
    enum: {
      values: ['New', '99%', '98%', 'Kính phẩy'], // Định nghĩa sẵn các tình trạng máy shop bạn kinh doanh
      message: 'Tình trạng máy phải là: New, 99%, 98% hoặc Kính phẩy'
    },
    default: 'New'
  },

  // Thuộc tính mở rộng riêng của đồ Apple (Có thể cần hoặc không, tùy bạn quyết định)
  region: {
    type: String,
    default: 'VN/A', // VN/A, LL/A (Mỹ), ZA/A (Singapore)...
    trim: true
  },

  // 4. QUẢN LÝ KINH DOANH (GIÁ & KHO)
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá bán cho biến thể này'],
    min: [0, 'Giá bán không thể âm']
  },
  
  originalPrice: {
    type: Number,
    min: [0, 'Giá gốc không thể âm'] // Dùng để hiển thị giá cũ lúc gạch đi khi có giảm giá
  },

  stock: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng tồn kho'],
    min: [0, 'Số lượng kho không thể nhỏ hơn 0'],
    default: 0
  },

  // 5. HÌNH ẢNH THỰC TẾ
  // Mỗi màu sắc hoặc tình trạng máy (như máy 98%) nên có hình ảnh thực tế riêng để khách xem
  images: {
    type: [String],
    default: []
  },

  imagesPublicId: {
    type: [String],
    default: []
  },
  // 6. TRẠNG THÁI KINH DOANH
  isActive: {
    type: Boolean,
    default: true // Dùng để ẩn biến thể này nếu ngừng kinh doanh bản này
  }
}, { 
  timestamps: true // Tự động tạo createdAt và updatedAt (Biết được ngày nhập hàng)
});

// Tạo index để tìm kiếm nhanh hơn theo sản phẩm và SKU
ProductVariantSchema.index({ product: 1 });
// ProductVariantSchema.index({ sku: 1 });

export default mongoose.model('ProductVariant', ProductVariantSchema);
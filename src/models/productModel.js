import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  // 1. LIÊN KẾT HỆ THỐNG
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Sản phẩm phải thuộc về một danh mục chính']
  },
  serie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Serie', // Liên kết tới model Serie của bạn (VD: iPhone 15 Series)
    required: [true, 'Sản phẩm phải thuộc về một dòng Series cụ thể']
  },

  // 2. THÔNG TIN HIỂN THỊ CHÍNH
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên sản phẩm gốc (Ví dụ: iPhone 15 Pro Max)'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true // Dùng cho đường dẫn URL tĩnh: iphone-15-pro-max
  },
  description: {
    type: String,
    default: '' // Bài viết mô tả chi tiết, đánh giá tính năng của máy (hỗ trợ HTML/Markdown)
  },
  
  // Ảnh đại diện chung cho cả dòng máy (Hiển thị ở trang danh sách sản phẩm ngoài trang chủ)
  mainImage: {
    type: String,
    required: [true, 'Vui lòng cung cấp ảnh đại diện chính cho dòng sản phẩm này']
  },
  mainImagePublicId: {
    type: String,
    required: [true, 'Vui lòng cung cấp public_id của ảnh đại diện chính để quản lý trên Cloudinary']
  },

  // 3. THÔNG SỐ KỸ THUẬT (SPECIFICATIONS)
  // Đồ Apple khách hàng rất quan tâm đến thông số, gom nhóm lại giúp bạn dễ quản lý và hiển thị dạng bảng
  specifications: {
    screen: { type: String, trim: true },      
    chip: { type: String, trim: true },     
    gpu: { type: String, trim: true },        
    ram: { type: String, trim: true },         
    rearCamera: { type: String, trim: true },  
    frontCamera: { type: String, trim: true }, 
    battery: { type: String, trim: true },     
    weight: { type: String, trim: true }       
  },

  // 4. TRẠNG THÁI & ĐÁNH GIÁ (BỔ SUNG ĐỂ HỆ THỐNG THỰC TẾ HƠN)
  isFeatured: {
    type: Boolean,
    default: false // Sản phẩm nổi bật (Dùng để đưa lên banner hoặc mục "Sản phẩm HOT" ở trang chủ)
  },
  isActive: {
    type: Boolean,
    default: true // true: Đang kinh doanh, false: Ẩn hoàn toàn khỏi website
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Đánh giá thấp nhất là 1 sao'],
    max: [5, 'Đánh giá cao nhất là 5 sao']
  },
  ratingsQuantity: {
    type: Number,
    default: 0 // Số lượng lượt đánh giá (để tính trung bình sao)
  }
}, {
  timestamps: true // Tự động tạo dữ liệu createdAt (ngày tạo) và updatedAt (ngày cập nhật)
});

// Tạo index để tối ưu tốc độ tìm kiếm theo tên, slug và bộ lọc theo dòng máy
ProductSchema.index({ name: 'text' }); // Hỗ trợ tìm kiếm theo từ khóa (Text Search)
// Note: slug index được tạo tự động từ unique: true, không cần khai báo lại
// ProductSchema.index({ category: 1, serie: 1 }); // Lưu ý sửa lại index nếu cần lọc theo cặp danh mục - series

const ProductModel = mongoose.model('Product', ProductSchema);

export default ProductModel;

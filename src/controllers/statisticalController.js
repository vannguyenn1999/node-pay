import { StatusCodes } from 'http-status-codes';
import PayModel from '~/models/payModel.js';
import ProductModel from '~/models/productModel.js';
import ProductVariantModel from '~/models/productVariantModel.js';

const getStatistics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 1. KPI Summaries
    const [totalProducts, totalOrdersResult, paidRevenueResult, thisMonthRevenueResult, lastMonthRevenueResult] = await Promise.all([
      ProductModel.countDocuments({}),
      PayModel.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            paidOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] },
            },
          },
        },
      ]),
      PayModel.aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      PayModel.aggregate([
        { $match: { status: 'PAID', createdAt: { $gte: startOfThisMonth } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
      PayModel.aggregate([
        { $match: { status: 'PAID', createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } } },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const totalOrders = totalOrdersResult[0]?.totalOrders || 0;
    const paidOrdersCount = totalOrdersResult[0]?.paidOrders || 0;
    const totalRevenue = paidRevenueResult[0]?.revenue || 0;
    const thisMonthRevenue = thisMonthRevenueResult[0]?.revenue || 0;
    const lastMonthRevenue = lastMonthRevenueResult[0]?.revenue || 0;
    const revenueDiff = thisMonthRevenue - lastMonthRevenue;

    // 2. Sales Trend (Dynamic ranges: 1w, 1m, 1y)
    const range = req.query.range || '1w';
    let formattedTrend = [];

    if (range === '1y') {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);
      twelveMonthsAgo.setHours(0, 0, 0, 0);

      const salesTrend = await PayModel.aggregate([
        {
          $match: {
            status: 'PAID',
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const trendMap = new Map(salesTrend.map(item => [item._id, item]));
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const dateStr = `${year}-${month}`;
        const entry = trendMap.get(dateStr) || { _id: dateStr, revenue: 0, orders: 0 };
        formattedTrend.push({
          date: `Tháng ${month}/${year}`,
          revenue: entry.revenue,
          orders: entry.orders,
        });
      }
    } else if (range === '1m') {
      const twentyEightDaysAgo = new Date();
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 27);
      twentyEightDaysAgo.setHours(0, 0, 0, 0);

      const salesTrend = await PayModel.aggregate([
        {
          $match: {
            status: 'PAID',
            createdAt: { $gte: twentyEightDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const trendMap = new Map(salesTrend.map(item => [item._id, item]));
      const dailyTrend = [];
      for (let i = 27; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const entry = trendMap.get(dateStr) || { _id: dateStr, revenue: 0, orders: 0 };
        dailyTrend.push({
          date: date,
          revenue: entry.revenue,
          orders: entry.orders,
        });
      }

      for (let w = 0; w < 4; w++) {
        const weekDays = dailyTrend.slice(w * 7, (w + 1) * 7);
        const startDate = weekDays[0].date;
        const endDate = weekDays[weekDays.length - 1].date;
        
        const startStr = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const endStr = `${endDate.getDate().toString().padStart(2, '0')}/${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const totalRevenue = weekDays.reduce((sum, d) => sum + d.revenue, 0);
        const totalOrders = weekDays.reduce((sum, d) => sum + d.orders, 0);
        
        formattedTrend.push({
          date: `${startStr} - ${endStr}`,
          revenue: totalRevenue,
          orders: totalOrders,
        });
      }
    } else {
      // Default: 1w (7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const salesTrend = await PayModel.aggregate([
        {
          $match: {
            status: 'PAID',
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const trendMap = new Map(salesTrend.map(item => [item._id, item]));
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const entry = trendMap.get(dateStr) || { _id: dateStr, revenue: 0, orders: 0 };
        formattedTrend.push({
          date: dateStr,
          revenue: entry.revenue,
          orders: entry.orders,
        });
      }
    }

    // 3. Status Distribution
    const statusDistributionResult = await PayModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = { PENDING: 0, PAID: 0, CANCELLED: 0 };
    statusDistributionResult.forEach((item) => {
      if (item._id in distribution) {
        distribution[item._id] = item.count;
      }
    });

    // 4. Best Selling Product Variants (Top 5)
    const bestSellersAgg = await PayModel.aggregate([
      { $match: { status: 'PAID' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productVariant',
          quantitySold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
    ]);

    const populatedBestSellers = await ProductVariantModel.populate(bestSellersAgg, {
      path: '_id',
      select: 'sku storage color condition price mainImage product',
      populate: {
        path: 'product',
        select: 'name mainImage',
      },
    });

    const bestSellers = populatedBestSellers.map((item) => ({
      variant: item._id,
      quantitySold: item.quantitySold,
    }));

    // 5. Low Stock/Storage Control (stock < 5)
    const lowStockAlerts = await ProductVariantModel.find({ stock: { $lt: 5 } })
      .populate('product', 'name')
      .select('sku storage color condition price stock product')
      .sort({ stock: 1 });

    // 6. Recent Orders (Last 5)
    const recentOrders = await PayModel.find({})
      .populate('user', 'email name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          paidOrdersCount,
          totalProducts,
          revenueDiff,
          lastMonthRevenue,
        },
        salesTrend: formattedTrend,
        distribution,
        bestSellers,
        lowStockAlerts,
        recentOrders,
      },
      message: 'Lấy dữ liệu thống kê thành công!',
    });
  } catch (error) {
    next(error);
  }
};

export const StatisticalController = {
  getStatistics,
};

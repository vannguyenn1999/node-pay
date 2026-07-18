import VipTierModel from '~/models/vipTierModel.js';

export const seedDefaultVipTiers = async () => {
  try {
    const count = await VipTierModel.countDocuments({});
    if (count === 0) {
      console.log('Seeding default VIP tiers...');
      const defaultTiers = [
        { name: 'Thành viên Đồng (Bronze)', minSpent: 0, discount: 0, color: 'linear-gradient(135deg, #cd7f32, #a05a2c)' },
        { name: 'Thành viên Bạc (Silver)', minSpent: 2000000, discount: 2, color: 'linear-gradient(135deg, #c0c0c0, #708090)' },
        { name: 'Thành viên Vàng (Gold)', minSpent: 10000000, discount: 5, color: 'linear-gradient(135deg, #ffd700, #ffa500, #ff8c00)' },
        { name: 'Thành viên Bạch Kim (Platinum)', minSpent: 30000000, discount: 8, color: 'linear-gradient(135deg, #e5e4e2, #00f2fe, #4facfe)' },
        { name: 'Thành viên Kim Cương (Diamond)', minSpent: 100000000, discount: 12, color: 'linear-gradient(45deg, #b000ff, #00e1ff, #ff0077, #b000ff)' },
      ];
      await VipTierModel.insertMany(defaultTiers);
      console.log('Seeded default VIP tiers successfully!');
    }
  } catch (error) {
    console.error('Error seeding default VIP tiers:', error);
  }
};

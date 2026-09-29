require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce');
  await User.deleteMany({}); await Product.deleteMany({});
  await User.create([
    { name: 'Admin', email: 'admin@shop.com', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { name: 'Demo User', email: 'user@shop.com', password: await bcrypt.hash('user123', 10) },
  ]);
  await Product.insertMany([
    { name: 'Wireless Headphones', description: 'Bluetooth, 30h battery', price: 1999, stock: 25, category: 'Electronics', image: 'https://picsum.photos/seed/headphones/400/300' },
    { name: 'Running Shoes', description: 'Lightweight and breathable', price: 2499, stock: 40, category: 'Fashion', image: 'https://picsum.photos/seed/shoes/400/300' },
    { name: 'Coffee Mug', description: 'Ceramic, 350ml', price: 299, stock: 100, category: 'Home', image: 'https://picsum.photos/seed/mug/400/300' },
    { name: 'Backpack', description: '25L water-resistant', price: 1299, stock: 30, category: 'Fashion', image: 'https://picsum.photos/seed/backpack/400/300' },
  ]);
  console.log('Seeded. Admin: admin@shop.com / admin123  |  User: user@shop.com / user123');
  process.exit(0);
})();

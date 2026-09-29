const router = require('express').Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

// Prices come from the database, never from the client
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, address } = req.body;
    if (!Array.isArray(items) || !items.length || !address)
      return res.status(400).json({ message: 'Items and address required' });

    const lines = [];
    let total = 0;
    for (const it of items) {
      const qty = parseInt(it.qty, 10);
      const p = await Product.findById(it.product);
      if (!p || !(qty > 0)) return res.status(400).json({ message: 'Invalid item in cart' });
      if (p.stock < qty) return res.status(400).json({ message: `Not enough stock for ${p.name}` });
      lines.push({ product: p._id, name: p.name, price: p.price, qty });
      total += p.price * qty;
    }
    for (const l of lines) await Product.findByIdAndUpdate(l.product, { $inc: { stock: -l.qty } });
    const order = await Order.create({ user: req.user._id, items: lines, total, address });
    res.status(201).json(order);
  } catch (e) { next(e); }
});

router.get('/mine', protect, async (req, res, next) => {
  try { res.json(await Order.find({ user: req.user._id }).sort('-createdAt')); } catch (e) { next(e); }
});

router.get('/', protect, adminOnly, async (req, res, next) => {
  try { res.json(await Order.find().populate('user', 'name email').sort('-createdAt')); } catch (e) { next(e); }
});

router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const o = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    o ? res.json(o) : res.status(404).json({ message: 'Order not found' });
  } catch (e) { e.status = 400; next(e); }
});

module.exports = router;

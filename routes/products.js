const router = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const pick = (b) => ({ name: b.name, description: b.description, price: b.price, stock: b.stock, image: b.image, category: b.category });

router.get('/', async (req, res, next) => {
  try {
    const q = {};
    if (req.query.search) q.name = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (req.query.category) q.category = req.query.category;
    res.json(await Product.find(q).sort('-createdAt'));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    p ? res.json(p) : res.status(404).json({ message: 'Product not found' });
  } catch (e) { next(e); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try { res.status(201).json(await Product.create(pick(req.body))); } catch (e) { e.status = 400; next(e); }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, pick(req.body), { new: true, runValidators: true });
    p ? res.json(p) : res.status(404).json({ message: 'Product not found' });
  } catch (e) { e.status = 400; next(e); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    p ? res.json({ message: 'Deleted' }) : res.status(404).json({ message: 'Product not found' });
  } catch (e) { next(e); }
});

module.exports = router;

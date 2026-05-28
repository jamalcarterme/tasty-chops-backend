const router  = require('express').Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/upload');

// GET /api/products  — public
router.get('/', async (req, res) => {
  try {
    const filter = { available: true };
    if (req.query.cat && req.query.cat !== 'all') filter.cat = req.query.cat;
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/all — admin (includes unavailable)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products — admin only, with image upload
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, desc, price, cat, badge } = req.body;
    if (!name || !desc || !price || !cat) {
      return res.status(400).json({ error: 'name, desc, price, cat are required' });
    }
    if (!req.file) return res.status(400).json({ error: 'Product image is required' });

    const product = await Product.create({
      name, desc,
      price: parseFloat(price),
      cat, badge: badge || '',
      img: req.file.path,
      imgPublicId: req.file.filename,
    });
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /api/products/:id — admin only
router.patch('/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, desc, price, cat, badge, available } = req.body;
    if (name) product.name = name;
    if (desc) product.desc = desc;
    if (price !== undefined) product.price = parseFloat(price);
    if (cat) product.cat = cat;
    if (badge !== undefined) product.badge = badge;
    if (available !== undefined) product.available = available === 'true' || available === true;

    // Replace image if new one uploaded
    if (req.file) {
      if (product.imgPublicId) {
        await cloudinary.uploader.destroy(product.imgPublicId).catch(() => {});
      }
      product.img = req.file.path;
      product.imgPublicId = req.file.filename;
    }

    await product.save();
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (product.imgPublicId) {
      await cloudinary.uploader.destroy(product.imgPublicId).catch(() => {});
    }
    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

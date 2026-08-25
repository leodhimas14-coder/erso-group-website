const Product = require('../models/Product');

async function listProducts(req, res, next) {
  try {
    const { category, includeUnavailable } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (!includeUnavailable) filter.available = true;

    const products = await Product.find(filter).sort({ category: 1, sortOrder: 1 });
    return res.json({ products });
  } catch (err) {
    return next(err);
  }
}

async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ product });
  } catch (err) {
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { available: false }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };

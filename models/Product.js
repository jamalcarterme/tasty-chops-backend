const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  desc:     { type: String, required: true, trim: true },
  price:    { type: Number, required: true, min: 0 },
  cat:      { type: String, required: true, enum: ['small-chops', 'grills', 'local', 'packs'], default: 'small-chops' },
  badge:    { type: String, default: '' },
  img:      { type: String, required: true },
  imgPublicId: { type: String, default: '' },
  available: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true
  },
  quantity: Number,
  expiry_date: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Batch", batchSchema);
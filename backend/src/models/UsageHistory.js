const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem"
  },
  quantity_used: Number,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("UsageHistory", usageSchema);
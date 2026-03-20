const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem"
  },
  quantity_used: Number,
  change : Number,
  type : String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("UsageHistory", usageSchema);
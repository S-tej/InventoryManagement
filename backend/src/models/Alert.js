const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem"
  },
  type: {
    type: String,
    enum: ["LOW_STOCK", "EXPIRY", "OVERSTOCK", "REORDER", "WASTE_RISK", "INFO","EXPIRED"]
  },
  message: String,
  is_read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Alert", alertSchema);
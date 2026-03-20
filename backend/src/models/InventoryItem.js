const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    category: String,

    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: "units"
    },

    min_threshold: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryItem", inventorySchema);
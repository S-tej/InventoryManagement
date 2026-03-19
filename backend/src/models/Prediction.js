const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  item_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem"
  },
  predicted_depletion_date: Date,
  confidence_score: Number
}, { timestamps: true });

module.exports = mongoose.model("Prediction", predictionSchema);
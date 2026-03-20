const { computePrediction } = require("../services/predictionService");
const InventoryItem = require("../models/InventoryItem");
const UsageHistory = require("../models/UsageHistory");
const Prediction = require("../models/Prediction");

// ➕ CREATE ITEM
exports.createItem = async (req, res) => {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📥 GET ALL ITEMS
exports.getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🔍 GET SINGLE ITEM
exports.getItemById = async (req, res) => {
  try {
    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✏️ UPDATE ITEM
exports.updateItem = async (req, res) => {
  try {
    const existingItem = await InventoryItem.findById(req.params.id);

    if (!existingItem)
      return res.status(404).json({ message: "Item not found" });

    const newQuantity = req.body.quantity;
    const oldQuantity = existingItem.quantity;

    if (newQuantity !== undefined) {
      const change = newQuantity - oldQuantity;

      await UsageHistory.create({
        item_id: existingItem._id,
        change: change,
        type: change < 0 ? "CONSUMPTION" : "RESTOCK",
      });
    }

    const updatedItem = await InventoryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    // 🔥 RECOMPUTE PREDICTION (IMPORTANT)
    const usage = await UsageHistory.find({ item_id: updatedItem._id }).sort(
      "timestamp",
    );

    const prediction = computePrediction(updatedItem, usage);

    await Prediction.findOneAndUpdate(
      { item_id: updatedItem._id },
      {
        predicted_depletion_date: prediction.depletion_date,
        confidence_score: prediction.confidence,
      },
      { upsert: true, returnDocument: "after" },
    );

    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ❌ DELETE ITEM
exports.deleteItem = async (req, res) => {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);

    if (!item) return res.status(404).json({ message: "Item not found" });

    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

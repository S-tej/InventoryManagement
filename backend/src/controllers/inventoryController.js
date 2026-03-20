const { computePrediction } = require("../services/predictionService");
const InventoryItem = require("../models/InventoryItem");
const UsageHistory = require("../models/UsageHistory");
const Prediction = require("../models/Prediction");
const Batch = require("../models/Batch");

// ➕ CREATE ITEM
exports.createItem = async (req, res) => {
  try {
    if (!req.body.name || req.body.quantity < 0) {
      return res.status(400).json({ error: "Invalid input" });
    }
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

// ✏️ CONSUME STOCK (FIFO)
exports.consumeStock = async (req, res) => {
  try {
    const { item_id, quantity_used } = req.body;

    let remaining = quantity_used;

    const batches = await Batch.find({ item_id }).sort("expiry_date");

    for (const batch of batches) {
      if (remaining <= 0) break;

      if (batch.quantity <= remaining) {
        remaining -= batch.quantity;
        await batch.deleteOne();
      } else {
        batch.quantity -= remaining;
        remaining = 0;
        await batch.save();
      }
    }

    // 🔥 ✅ ADD THIS HERE (VERY IMPORTANT)
    await UsageHistory.create({
      item_id,
      quantity_used,
    });

    // 🔥 Update total quantity
    const updatedBatches = await Batch.find({ item_id });
    const total = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);

    await InventoryItem.findByIdAndUpdate(item_id, {
      quantity: total,
    });

    res.json({ message: "Stock consumed successfully" });
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

// ➕ ADD STOCK (NEW)
exports.addStock = async (req, res) => {
  try {
    const { item_id, quantity, expiry_date } = req.body;

    const batch = await Batch.create({
      item_id,
      quantity,
      expiry_date,
    });

    // 🔥 Update total quantity
    const batches = await Batch.find({ item_id });
    const total = batches.reduce((sum, b) => sum + b.quantity, 0);

    await InventoryItem.findByIdAndUpdate(item_id, {
      quantity: total,
    });

    res.json(batch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBatches = async (req, res) => {
  const batches = await Batch.find({ item_id: req.params.id }).sort(
    "expiry_date",
  );

  res.json(batches);
};

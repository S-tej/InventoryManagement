const InventoryItem = require("../models/InventoryItem");
const Prediction = require("../models/Prediction");

const buildContext = async (intent, query) => {
  const items = await InventoryItem.find();

  let matchedItem = null;

  for (const item of items) {
    if (query.toLowerCase().includes(item.name.toLowerCase())) {
      matchedItem = item;
      break;
    }
  }

  if (!matchedItem) return null;

  const prediction = await Prediction.findOne({ item_id: matchedItem._id });

  return {
    item: {
      name: matchedItem.name,
      quantity: matchedItem.quantity,
      expiry_date: matchedItem.expiry_date
    },
    prediction
  };
};

module.exports = { buildContext };
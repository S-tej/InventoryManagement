const express = require("express");
const router = express.Router();

const {
  createItem,
  getAllItems,
  getItemById,
  deleteItem,
  addStock,
  consumeStock,
  getBatches
} = require("../controllers/inventoryController");

// CRUD Routes
router.post("/", createItem);
router.get("/", getAllItems);
router.get("/:id/batches", getBatches);
router.get("/:id", getItemById);
router.delete("/:id", deleteItem);
router.post("/add-stock", addStock);
router.post("/consume", consumeStock);


module.exports = router;
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const inventoryRoutes = require("./src/routes/inventoryRoutes");
const startCron = require("./src/cron/inventoryCron");
const mcpRoutes = require("./src/routes/mcpRoutes");
const connectDB = require("./src/config/db");
const Alert = require("./src/models/Alert");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/inventory", inventoryRoutes);
app.use("/api/mcp", mcpRoutes);

app.get("/api/alerts", async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.json(alerts);
});

connectDB();
startCron();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
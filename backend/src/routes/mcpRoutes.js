const express = require("express");
const router = express.Router();

const { handleQuery } = require("../controllers/mcpController");

router.post("/query", handleQuery);

module.exports = router;
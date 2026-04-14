const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const receiptController = require("../controllers/receiptController");

router.post("/upload", upload.single("image"), receiptController.uploadReceipt);

module.exports = router;
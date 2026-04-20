const express = require("express");
const router = express.Router();
const receiptController = require("../controllers/receiptController");
const auth = require("../middlewares/auth.js");
const upload = require("../middlewares/upload.js");

router.post("/upload", auth, upload.single("image"), receiptController.uploadReceipt);

module.exports = router;
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const receiptController = require("../controllers/receiptController");

// upload.single("image") -> Postman에서 "image"라는 키값으로 파일을 보내야 함을 의미합니다.
router.post("/upload", upload.single("image"), receiptController.uploadReceipt);

module.exports = router;
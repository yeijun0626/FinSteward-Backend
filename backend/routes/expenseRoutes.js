const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const auth = require("../middlewares/auth"); // ⭐ 문지기 호출

// 이제 모든 지출 관련 API는 로그인을 해야만 함!
router.post("/", auth, expenseController.createExpense);
router.get("/summary", auth, expenseController.getSummary);
router.get("/list", auth, expenseController.getAll);
router.put("/:id", auth, expenseController.update);
router.delete("/:id", auth, expenseController.remove);

module.exports = router;
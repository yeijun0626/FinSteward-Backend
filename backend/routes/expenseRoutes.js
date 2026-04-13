const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const auth = require("../middlewares/auth"); 


router.post("/", auth, expenseController.createExpense);
router.get("/summary", auth, expenseController.getSummary);
router.get("/list", auth, expenseController.getAll);
router.put("/:id", auth, expenseController.update);
router.delete("/:id", auth, expenseController.remove);

module.exports = router;
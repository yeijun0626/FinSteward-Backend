const expenseModel = require("../models/expenseModel");

const createExpense = (req, res) => {
    expenseModel.createExpense(req.body, (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: "지출 등록 성공", id: result.insertId });
    });
};

const getSummary = (req, res) => {
    expenseModel.getExpenseSummary(req.query.user_id || 3, (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ summary: results });
    });
};

const getAll = (req, res) => {
    expenseModel.getAllExpenses(req.query.user_id || 3, (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json({ expenses: results });
    });
};

// ⭐ 수정 컨트롤러 추가
const update = (req, res) => {
    expenseModel.updateExpense(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "수정 성공" });
    });
};

// ⭐ 삭제 컨트롤러 추가
const remove = (req, res) => {
    expenseModel.deleteExpense(req.params.id, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "삭제 성공" });
    });
};

module.exports = { createExpense, getSummary, getAll, update, remove };
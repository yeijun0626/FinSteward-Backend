const expenseModel = require("../models/expenseModel");

const createExpense = (req, res) => {
    const expenseData = {
        ...req.body,
        user_id: req.user.userId
    };
    expenseModel.createExpense(expenseData, (err, result) => {
        if (err) return res.status(500).json(err);
        res.status(201).json({ message: "지출 등록 성공", id: result.insertId });
    });
};

const getSummary = (req, res) => {
    const userId = req.user.userId;
    expenseModel.getExpenseSummary(userId, (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
};

const getAll = (req, res) => {
    const userId = req.user.userId;
    expenseModel.getAllExpenses(userId, (err, results) => {
        if (err) return res.status(500).json(err);
        res.status(200).json(results);
    });
};

const update = (req, res) => {
    expenseModel.updateExpense(req.params.id, req.body, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "수정 성공" });
    });
};

const remove = (req, res) => {
    expenseModel.deleteExpense(req.params.id, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "삭제 성공" });
    });
};

module.exports = { createExpense, getSummary, getAll, update, remove };
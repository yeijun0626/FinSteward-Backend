const db = require("../db");

const createExpense = (data, callback) => {
    const query = "INSERT INTO expense (user_id, category_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)";
    db.query(query, [data.user_id, data.category_id, data.amount, data.description, data.expense_date], callback);
};

const getExpenseSummary = (userId, callback) => {
    const query = `
        SELECT c.name as category_name, SUM(e.amount) as total_amount, COUNT(e.expense_id) as count
        FROM expense e JOIN category c ON e.category_id = c.category_id
        WHERE e.user_id = ? GROUP BY e.category_id`;
    db.query(query, [userId], callback);
};

const getAllExpenses = (userId, callback) => {
    const query = `
        SELECT e.*, u.name as spender_name 
        FROM expense e 
        LEFT JOIN user u ON e.user_id = u.user_id 
        WHERE e.user_id = ? 
        ORDER BY e.expense_date DESC
    `;
    db.query(query, [userId], callback);
};

const updateExpense = (id, data, callback) => {
    const query = "UPDATE expense SET category_id = ?, amount = ?, description = ?, expense_date = ? WHERE expense_id = ?";
    db.query(query, [data.category_id, data.amount, data.description, data.expense_date, id], callback);
};

const deleteExpense = (id, callback) => {
    const query = "DELETE FROM expense WHERE expense_id = ?";
    db.query(query, [id], callback);
};

module.exports = { createExpense, getExpenseSummary, getAllExpenses, updateExpense, deleteExpense };
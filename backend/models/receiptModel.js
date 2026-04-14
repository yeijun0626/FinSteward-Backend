const db = require("../db");

const createReceipt = (receiptData, callback) => {
    const { expense_id, image_url, store_name, purchase_date } = receiptData;
    const query = "INSERT INTO receipt (expense_id, image_url, store_name, purchase_date) VALUES (?, ?, ?, ?)";
    
    db.query(query, [expense_id, image_url, store_name, purchase_date], (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
    });
};

module.exports = { createReceipt };
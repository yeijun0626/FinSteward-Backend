const db = require("../db");

const getAllUsers = (callback) => {
    const query = "SELECT * FROM user";

    db.query(query, (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

module.exports = {
    getAllUsers
};

const createUser = (userData, callback) => {
    const { email, password, name, account_type } = userData;
    const query = "INSERT INTO user (email, password, name, account_type) VALUES (?, ?, ?, ?)";
    
    db.query(query, [email, password, name, account_type], (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
    });
};

const getUserByEmail = (email, callback) => {
    const query = "SELECT * FROM user WHERE email = ?";
    
    db.query(query, [email], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results[0]);
    });
};


module.exports = { getAllUsers, createUser, getUserByEmail };
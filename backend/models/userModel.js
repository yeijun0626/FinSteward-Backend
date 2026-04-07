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

// backend/models/userModel.js 에 추가

// 회원가입: 새로운 유저 정보를 DB에 저장합니다.
const createUser = (userData, callback) => {
    const { email, password, name, account_type } = userData;
    const query = "INSERT INTO user (email, password, name, account_type) VALUES (?, ?, ?, ?)";
    
    // ? 자리에 실제 데이터를 안전하게 넣습니다.
    db.query(query, [email, password, name, account_type], (err, result) => {
        if (err) return callback(err, null);
        callback(null, result);
    });
};
// 로그인: 이메일을 기준으로 유저 정보를 찾아옵니다.
const getUserByEmail = (email, callback) => {
    const query = "SELECT * FROM user WHERE email = ?";
    
    db.query(query, [email], (err, results) => {
        if (err) return callback(err, null);
        // 결과가 배열로 나오므로, 첫 번째 데이터(results[0])만 전달합니다.
        callback(null, results[0]);
    });
};

// 새로 만든 함수를 추가해서 내보냅니다.
module.exports = { getAllUsers, createUser, getUserByEmail };
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "rootroot",
  database: "finsteward",
  port: 3306
});

db.connect((err) => {
  if (err) {
    console.error("DB 연결 실패:", err);
    return;
  }
  console.log("MySQL 연결 성공");
});

module.exports = db;
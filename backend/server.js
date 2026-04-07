const express = require("express");
const path = require("path"); // 파일 경로 처리를 위한 기본 모듈
const db = require("./db");

// 1. 라우터 파일들 불러오기
const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const receiptRoutes = require("./routes/receiptRoutes");

const app = express();

// 2. 미들웨어 설정
app.use(express.json()); // JSON 데이터 파싱
app.use(express.urlencoded({ extended: true })); // Form-data 파싱 지원

// ⭐ 중요: 업로드된 이미지를 브라우저나 Postman에서 볼 수 있도록 '정적 폴더'로 설정
// 이제 http://localhost:3000/uploads/파일명 으로 이미지 접근이 가능합니다.
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 3. API 경로 연결
app.get("/", (req, res) => {
    res.send("FinSteward AI Server is running!");
});

app.use("/api", userRoutes);            // 사용자 관련 (회원가입, 로그인)
app.use("/api/expense", expenseRoutes); // 지출 내역 관련
app.use("/api/receipt", receiptRoutes);  // 영수증 업로드 관련

// 4. 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
    console.log("========================================");
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📂 업로드 저장소: ${path.join(__dirname, "uploads")}`);
    console.log("========================================");
});
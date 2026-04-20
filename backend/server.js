const express = require("express");
const cors = require("cors");
const path = require("path"); 
const db = require("./db");


const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const receiptRoutes = require("./routes/receiptRoutes");

const app = express();


app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 


app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.get("/", (req, res) => {
    res.send("FinSteward AI Server is running!");
});

app.use("/api", userRoutes);           
app.use("/api/expense", expenseRoutes); 
app.use("/api/receipt", receiptRoutes);  


const PORT = 3000;
app.listen(PORT, () => {
    console.log("========================================");
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📂 업로드 저장소: ${path.join(__dirname, "uploads")}`);
    console.log("========================================");
});

app.use("/api", userRoutes);
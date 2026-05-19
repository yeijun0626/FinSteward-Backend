const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");

const app = express();
const teamRoutes = require('./routes/teamRoutes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "public")));


app.use("/api", require("./routes/userRoutes"));
app.use("/api/expense", require("./routes/expenseRoutes"));
app.use("/api/receipt", require("./routes/receiptRoutes"));
app.use("/api/category", require("./routes/categoryRoutes"));
app.use('/api/teams', teamRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log("========================================");
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log("========================================");
});
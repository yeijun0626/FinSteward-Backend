const receiptModel = require("../models/receiptModel");
const expenseModel = require("../models/expenseModel");
const { analyzeReceipt } = require("../services/ocrService");
const path = require("path");

const uploadReceipt = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "이미지 파일이 없습니다." });
    }

    try {
        const absolutePath = path.join(process.cwd(), req.file.path);
        const ocrResult = await analyzeReceipt(absolutePath);
        
        if (!ocrResult) {
            return res.status(500).json({ message: "AI 분석에 실패했습니다." });
        }

        const storeName = ocrResult.storeName || "알 수 없는 상점";
        const categoryId = ocrResult.categoryId || 5; 
        
        let rawAmount = ocrResult.totalAmount || 0;
        let totalAmount = 0;
        if (typeof rawAmount === 'string') {
            totalAmount = parseInt(rawAmount.replace(/,/g, '')) || 0;
        } else {
            totalAmount = parseInt(rawAmount) || 0;
        }

        const autoExpenseData = {
            user_id: req.user.userId,
            category_id: categoryId, 
            amount: totalAmount,
            description: `[영수증 자동등록] ${storeName}`,
            expense_date: new Date()
        };

        expenseModel.createExpense(autoExpenseData, (err, expenseResult) => {
            if (err) return res.status(500).json({ message: "지출 등록 실패", error: err });

            const newExpenseId = expenseResult.insertId;

            const receiptData = {
                expense_id: newExpenseId,
                image_url: `/uploads/${req.file.filename}`,
                store_name: storeName,
                purchase_date: new Date()
            };

            receiptModel.createReceipt(receiptData, (err, result) => {
                if (err) return res.status(500).json({ message: "영수증 저장 실패", error: err });
                
                res.status(201).json({ 
                    message: "분석 및 등록 완료!", 
                    expense_id: newExpenseId,
                    storeName: storeName,
                    amount: totalAmount
                });
            });
        });

    } catch (error) {
        res.status(500).json({ message: "서버 오류", error: error.message });
    }
};

module.exports = { uploadReceipt };
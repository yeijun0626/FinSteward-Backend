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

        // 1. AI 분석 호출 (이제 카테고리 ID까지 받아옵니다)
        const ocrResult = await analyzeReceipt(absolutePath);
        
        if (!ocrResult) {
            return res.status(500).json({ message: "AI 분석에 실패했습니다." });
        }

        const storeName = ocrResult.storeName || "알 수 없는 상점";
        const categoryId = ocrResult.categoryId || 5; // AI가 판단한 카테고리 (없으면 기타)
        
        // 2. 금액 데이터 정제 (콤마 제거 및 숫자 변환)
        let rawAmount = ocrResult.totalAmount || 0;
        let totalAmount = 0;
        if (typeof rawAmount === 'string') {
            totalAmount = parseInt(rawAmount.replace(/,/g, '')) || 0;
        } else {
            totalAmount = parseInt(rawAmount) || 0;
        }

        // 3. [지출 테이블] 자동 등록 (categoryId 적용)
        const autoExpenseData = {
            user_id: 3, // 테스트용 계정
            category_id: categoryId, 
            amount: totalAmount,
            description: `[영수증 자동등록] ${storeName}`,
            expense_date: new Date()
        };

        expenseModel.createExpense(autoExpenseData, (err, expenseResult) => {
            if (err) return res.status(500).json({ message: "지출 등록 실패", error: err });

            const newExpenseId = expenseResult.insertId;

            // 4. [영수증 테이블] 이미지 연결 저장
            const receiptData = {
                expense_id: newExpenseId,
                image_url: `/uploads/${req.file.filename}`,
                store_name: storeName,
                purchase_date: new Date()
            };

            receiptModel.createReceipt(receiptData, (err, result) => {
                if (err) return res.status(500).json({ message: "영수증 저장 실패", error: err });
                
                res.status(201).json({ 
                    message: "AI 영수증 분석 및 지출 내역 자동 등록 완료!", 
                    expense_id: newExpenseId,
                    storeName: storeName,
                    amount: totalAmount,
                    category_id: categoryId
                });
            });
        });

    } catch (error) {
        console.error("컨트롤러 에러:", error);
        res.status(500).json({ message: "서버 처리 중 오류 발생", error: error.message });
    }
};

module.exports = { uploadReceipt };
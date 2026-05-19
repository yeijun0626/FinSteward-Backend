const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeReceipt = async (imagePath, categoriesText) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        
        let imageBuffer;
        if (imagePath.startsWith('http')) {
            const response = await fetch(imagePath);
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
        } else {
            const fs = require('fs');
            imageBuffer = fs.readFileSync(imagePath);
        }
        
        const imageParts = [
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
        ];

        const prompt = `영수증이나 계좌 거래내역 이미지에서 storeName, itemName, totalAmount, categoryId를 JSON으로 추출해. 
        totalAmount는 지출(출금, 결제)이면 음수(-), 수입(입금, 급여)이면 양수(+)로 표기해.
        현재 사용 가능한 카테고리 목록: [${categoriesText}]. 목록에 있는 categoryId 중 가장 적절한 숫자를 하나만 골라.
        형식: {"storeName": "회사", "itemName": "급여", "totalAmount": 2000000, "categoryId": 8}`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{.*\}/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    } catch (error) {
        console.error(error);
        return null;
    }
};

const generateReport = async (expenseData, budget, income, totalExpense) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `너는 FinSteward라는 AI가계부에서 AI분석 리포트를 담당하고 있는 AI야.
        다음은 사용자의 이번 달 지출 내역이야: ${JSON.stringify(expenseData)}.
        참고 데이터 - 예산: ${budget}원, 수입: ${income}원, 지출합계: ${totalExpense}원.
        이 데이터를 바탕으로 사용자의 소비 패턴과 수입패턴을 분석하고, 
        절약 팁과 앞으로의 예산, 수입을 보고 소비습관에 관한 컨설팅을 딱 4줄 이내로 짧게 작성해줘.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        return "데이터 분석 중 오류가 발생했습니다.";
    }
};

module.exports = { analyzeReceipt, generateReport };
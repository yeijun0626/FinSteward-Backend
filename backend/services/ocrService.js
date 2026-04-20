const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
require("dotenv").config(); 


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeReceipt = async (imagePath) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const imageBuffer = fs.readFileSync(imagePath);
        const imageParts = [
            {
                inlineData: {
                    data: imageBuffer.toString("base64"),
                    mimeType: "image/jpeg",
                },
            },
        ];

        const prompt = `영수증 이미지에서 상점 이름(storeName), 총 금액(totalAmount), 카테고리 ID(categoryId)를 JSON 형식으로 추출해줘. 
        카테고리는 [1: 식비, 2: 교통, 3: 쇼핑, 4: 의료, 5: 기타] 중 하나로 선택해.
        예시: {"storeName": "스타벅스", "totalAmount": 5000, "categoryId": 1}`;

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        
        const jsonMatch = text.match(/\{.*\}/s);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    } catch (error) {
        console.error("OCR 서비스 에러:", error);
        return null;
    }
};

module.exports = { analyzeReceipt };
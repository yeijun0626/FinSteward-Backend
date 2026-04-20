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

        const prompt = `영수증 이미지에서 storeName, totalAmount, categoryId를 JSON으로 추출해. 
        카테고리: [1:식비, 2:교통, 3:쇼핑, 4:의료, 5:기타].
        형식: {"storeName": "상호명", "totalAmount": 1000, "categoryId": 1}`;

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

module.exports = { analyzeReceipt };
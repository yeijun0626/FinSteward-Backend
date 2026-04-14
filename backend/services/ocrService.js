const vision = require('@google-cloud/vision');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: path.join(__dirname, '../google-key.json') 
});

const genAI = new GoogleGenerativeAI("AIzaSyBhJZjqYUk-GapK9QNFGpJskhJC9Uo5NTY");

const analyzeReceipt = async (imagePath) => {
    try {
        const [result] = await visionClient.textDetection(imagePath);
        const fullText = result.textAnnotations[0]?.description;
        
        if (!fullText || fullText.length < 10) {
            throw new Error("이미지에서 글자를 읽을 수 없습니다. 선명한 영수증 사진을 올려주세요.");
        }

        const keywords = ["원", "합계", "금액", "주소", "번호", "부가세", "Total", "Amount", "VAT"];
        const isReceipt = keywords.some(word => fullText.includes(word));
        
        if (!isReceipt) {
            throw new Error("영수증이 아닌 것 같습니다. 영수증 사진을 다시 확인해주세요.");
        }

        console.log("--- 영수증 판별 성공: 분석 시작 ---");

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            너는 영수증 분석 전문가야. 아래 텍스트에서 '상호명', '합계 금액', '카테고리 ID'를 추출해줘.
            반드시 JSON 형식으로만 응답해.
            
            카테고리 ID 규칙:
            1: 식비 (식당, 카페, 마트, 편의점)
            2: 교통 (택시, 버스, 주유소)
            3: 쇼핑 (백화점, 옷가게, 다이소)
            4: 취미 (영화, 헬스, 노래방)
            5: 기타
            
            형식: {"storeName": "가게이름", "totalAmount": 15000, "categoryId": 1}
            텍스트: ${fullText}
        `;

        const geminiResult = await model.generateContent(prompt, { apiVersion: 'v1' });
        const response = await geminiResult.response;
        const text = response.text();

        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error("AI 분석 결과 해석 실패");

    } catch (error) {
        console.error("OCR 서비스 에러:", error.message);
        throw error;
    }
};

module.exports = { analyzeReceipt };
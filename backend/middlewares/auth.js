const jwt = require("jsonwebtoken");
const JWT_SECRET = "finsteward_secret_key_1234";

const authMiddleware = (req, res, next) => {
    // 헤더에서 토큰 꺼내기
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "인증 토큰이 없습니다. 로그인이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // 다음 함수에서 req.user.userId 로 꺼내 쓸 수 있음
        next();
    } catch (error) {
        res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};

module.exports = authMiddleware;
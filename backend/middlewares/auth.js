const jwt = require("jsonwebtoken");
const JWT_SECRET = "finsteward_secret_key_1234";

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ message: "인증 토큰이 없습니다. 로그인이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; 
        next();
    } catch (error) {
        res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};

module.exports = authMiddleware;
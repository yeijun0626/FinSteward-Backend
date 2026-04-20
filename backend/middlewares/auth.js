const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "인증 토큰이 없습니다." });

    jwt.verify(token, "finsteward_secret_key_1234", (err, user) => {
        if (err) return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
        req.user = user;
        next();
    });
};
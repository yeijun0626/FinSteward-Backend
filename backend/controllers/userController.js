const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 시크릿 키 (보통 .env 파일에 넣지만, 일단 여기 적어둘게요)
const JWT_SECRET = "finsteward_secret_key_1234";

const getUsers = (req, res) => {
    userModel.getAllUsers((err, users) => {
        if (err) return res.status(500).json({ message: "조회 실패", error: err });
        res.json(users);
    });
};

// 1. 회원가입 (비밀번호 암호화 추가)
const registerUser = async (req, res) => {
    const { email, password, name, account_type } = req.body;

    try {
        // 비밀번호 암호화 (Salt 생성 및 해싱)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = { email, password: hashedPassword, name, account_type };

        userModel.createUser(userData, (err, result) => {
            if (err) return res.status(500).json({ message: "회원가입 실패", error: err });
            res.status(201).json({ message: "회원가입 성공!", userId: result.insertId });
        });
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
};

// 2. 로그인 (JWT 토큰 발급 추가)
const loginUser = (req, res) => {
    const { email, password } = req.body;

    userModel.getUserByEmail(email, async (err, user) => {
        if (err) return res.status(500).json({ message: "로그인 중 오류 발생", error: err });
        if (!user) return res.status(401).json({ message: "존재하지 않는 이메일입니다." });

        // 암호화된 비밀번호와 입력한 비밀번호 비교
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 틀렸습니다." });

        // 로그인 성공 시 JWT 토큰 생성 (유효기간 1일)
        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "로그인 성공!",
            token: token, // 👈 이제 이 토큰을 프론트엔드에서 들고 있어야 합니다.
            user: { id: user.user_id, name: user.name, email: user.email }
        });
    });
};

module.exports = { getUsers, registerUser, loginUser };
const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "finsteward_secret_key_1234";

const getUsers = (req, res) => {
    userModel.getAllUsers((err, users) => {
        if (err) return res.status(500).json({ message: "조회 실패", error: err });
        res.json(users);
    });
};

const registerUser = async (req, res) => {
    const { email, password, name, account_type } = req.body;

    try {
        userModel.getUserByEmail(email, async (err, existingUser) => {
            if (err) return res.status(500).json({ message: "서버 오류", error: err });
            
            if (existingUser) {
                return res.status(400).json({ message: "이미 가입된 이메일입니다." });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userData = { email, password: hashedPassword, name, account_type };

            userModel.createUser(userData, (err, result) => {
                if (err) return res.status(500).json({ message: "회원가입 실패", error: err });
                res.status(201).json({ message: "회원가입 성공!", userId: result.insertId });
            });
        });
    } catch (error) {
        res.status(500).json({ message: "서버 오류", error });
    }
};

const loginUser = (req, res) => {
    const { email, password } = req.body;

    userModel.getUserByEmail(email, async (err, user) => {
        if (err) return res.status(500).json({ message: "로그인 중 오류 발생", error: err });
        if (!user) return res.status(401).json({ message: "존재하지 않는 이메일입니다." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "비밀번호가 틀렸습니다." });

        const token = jwt.sign(
            { userId: user.user_id, email: user.email },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "로그인 성공!",
            token: token, 
            user: { id: user.user_id, name: user.name, email: user.email }
        });
    });
};

module.exports = { getUsers, registerUser, loginUser };
const express = require("express");
const router = express.Router();
// 컨트롤러(실제 동작)를 불러옵니다. 점 두 개(..) 확인!
const userController = require("../controllers/userController");

// [기존 기능] 모든 유저 조회
router.get("/users", userController.getUsers);

// [추가된 기능] 회원 가입
router.post("/users", userController.registerUser);

// POST 방식으로 /api/login 에 요청이 오면 loginUser 실행
router.post("/login", userController.loginUser);

module.exports = router;
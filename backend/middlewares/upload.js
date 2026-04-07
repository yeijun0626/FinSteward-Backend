const multer = require("multer");
const path = require("path");

// 이미지가 저장될 장소와 파일 이름 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // 아까 만든 uploads 폴더에 저장
    },
    filename: (req, file, cb) => {
        // 파일 중복을 피하기 위해 현재 시간(Date.now)을 파일명 앞에 붙입니다.
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
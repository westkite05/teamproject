const express = require("express")
const session = require("express-session")
const cors = require("cors")
const mysql = require("mysql2")
const bcrypt = require("bcrypt")
const multer = require("multer")
require("dotenv").config()

const app = express()
const PORT = 8000

// 파일 업로드 설정
const upload = multer({ dest: "uploads/" })

app.use(express.json())
app.use(
  cors({
    origin: "http://localhost:3000", // React 앱 주소
    credentials: true,
  })
)

// 세션 설정
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // HTTPS면 true
  })
)

// DB 연결
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})
db.connect((err) => {
  if (err) console.log("DB 연결 실패:", err)
  else console.log("MySQL 연결 성공")
})

// 라우터 예시
app.get("/", (req, res) => {
  res.send("백엔드 서버 실행 중!")
})

// 파일 업로드 라우터
app.post("/upload-log", upload.single("logFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." })
  }

  console.log("업로드된 파일 정보:", req.file)
  res.json({ message: "파일 업로드 성공!" })
})

// 테스트용 로그인 라우트
app.post("/api/login", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  // DB 연결 후 실제 확인 가능, 테스트용 간단 로직
  if (username === "test" && password === "1234") {
    req.session.user = username
    return res.json({ message: "로그인 성공!", username })
  } else {
    return res
      .status(401)
      .json({ message: "아이디 또는 비밀번호가 틀렸습니다." })
  }
})

// 테스트용 회원가입 라우트
app.post("/api/signup", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  // DB에 사용자 저장 로직 필요, 여기서는 단순 확인
  res.json({ message: "회원가입 성공!" })
})

// 서버 실행
app.listen(PORT, () => console.log(`✅ 서버 실행: http://localhost:${PORT}`))

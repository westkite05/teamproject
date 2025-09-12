const express = require("express")
const session = require("express-session")
const cors = require("cors")
const mysql = require("mysql2")
const bcrypt = require("bcrypt")
const multer = require("multer")
require("dotenv").config()

const app = express()
const PORT = 8000

const upload = multer({ dest: "uploads/" })

app.use(express.json())
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
)

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
)

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

app.get("/", (req, res) => {
  res.send("백엔드 서버 실행 중!")
})

app.post("/upload-log", upload.single("logFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." })
  }

  console.log("업로드된 파일 정보:", req.file)
  res.json({ message: "파일 업로드 성공!" })
})

app.post("/api/login", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  if (username === "test" && password === "1234") {
    req.session.user = username
    return res.json({ message: "로그인 성공!", username })
  } else {
    return res
      .status(401)
      .json({ message: "아이디 또는 비밀번호가 틀렸습니다." })
  }
})

app.post("/api/signup", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  res.json({ message: "회원가입 성공!" })
})

app.listen(PORT, () => console.log(`✅ 서버 실행: http://localhost:${PORT}`))

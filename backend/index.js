const express = require("express")
const session = require("express-session")
const cors = require("cors")
const mysql = require("mysql2")
const bcrypt = require("bcrypt")
const multer = require("multer")
const { Client } = require("@elastic/elasticsearch") // ✅ 추가
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

// ✅ MySQL 연결
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
})

db.connect((err) => {
  if (err) console.error("DB 연결 실패:", err)
  else console.log("✅ MySQL 연결 성공")
})

// ✅ Elasticsearch 연결
const esClient = new Client({ node: "http://localhost:9200" })

async function connectElasticsearch() {
  try {
    await esClient.ping()
    console.log("✅ Elasticsearch 연결 성공")
  } catch (error) {
    console.error("❌ Elasticsearch 연결 실패:", error.message)
  }
}
connectElasticsearch()

// 기본 라우트
app.get("/", (req, res) => {
  res.send("백엔드 서버 실행 중!")
})

// ✅ Elasticsearch 상태 확인용 API
app.get("/api/es-status", async (req, res) => {
  try {
    const health = await esClient.cluster.health()
    res.json({ message: "Elasticsearch 연결 OK", health })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Elasticsearch 연결 실패" })
  }
})

// 로그 업로드 테스트
app.post("/upload-log", upload.single("logFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "파일이 없습니다." })
  }
  console.log("업로드된 파일 정보:", req.file)
  res.json({ message: "파일 업로드 성공!" })
})

// ✅ 회원가입 API
app.post("/api/signup", async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    db.query(
      "INSERT INTO users (username, password, created_at) VALUES (?, ?, NOW())",
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("회원가입 오류:", err)
          return res.status(500).json({ message: "회원가입 실패" })
        }
        console.log("회원가입 성공:", result)
        res.json({ message: "회원가입 성공!" })
      }
    )
  } catch (err) {
    console.error("서버 오류:", err)
    res.status(500).json({ message: "서버 오류" })
  }
})

// ✅ 로그인 API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력하세요." })
  }

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) {
        console.error("로그인 오류:", err)
        return res.status(500).json({ message: "로그인 실패" })
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "존재하지 않는 사용자입니다." })
      }

      const user = results[0]
      const isMatch = await bcrypt.compare(password, user.password)

      if (!isMatch) {
        return res.status(401).json({ message: "비밀번호가 틀렸습니다." })
      }

      req.session.user = { id: user.id, username: user.username }
      console.log("로그인 성공:", req.session.user)
      res.json({ message: "로그인 성공!", username: user.username })
    }
  )
})

// ✅ 로그인 상태 확인 API
app.get("/api/me", (req, res) => {
  if (req.session.user) {
    return res.json({ loggedIn: true, user: req.session.user })
  } else {
    return res.json({ loggedIn: false })
  }
})

// ✅ 로그아웃 API
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid")
    res.json({ message: "로그아웃 완료" })
  })
})

app.listen(PORT, () => console.log(`✅ 서버 실행: http://localhost:${PORT}`))

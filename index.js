require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { urlencoded } = require("body-parser")
const cookieParser = require("cookie-parser")
const dbConnection = require("./config/mongoose")
const authRouter = require("./routes/authRouter")
const contactRouter = require("./routes/contactRouter")
const mailRouter = require("./nodemailer/nodemailer")
const firebaseRouter = require("./routes/firebaseRouter")
const houseRouter = require("./routes/houseRouter")

const app = express()
const PORT = process.env.PORT

app.set('trust proxy', 1); // Para el Rate Limiter
app.use(urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

dbConnection()

app.use(cors({
    origin: [`${process.env.BACK_END_RENDER_URL}`, `${process.env.API_BACKEND_URL}`, `${process.env.FRONT_END}`, `${process.env.FRONT_END_WWW}`, `${process.env.LOCAL_HOST}`].filter(Boolean),
    methods: [ "GET", "POST", "PUT", "PATCH", "DELETE" ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(authRouter)
app.use(contactRouter)
app.use(mailRouter)
app.use(firebaseRouter)
app.use(houseRouter)

app.use((req,res) => {
    res.send(`<h1>404 - Not Found</h1>`)
})

app.listen(PORT, "0.0.0.0", (req, res) => {
    console.log(`Server listening🟢`)
})
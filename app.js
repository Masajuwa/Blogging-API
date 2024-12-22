const express = require("express");
const bodyParser = require("body-parser")
const ejs = require("ejs")
const methodOverride = require('method-override');
require("dotenv").config()
const cookieParser = require("cookie-parser")
const authRouter = require("./routes/auth")
const articleRouter = require("./routes/blog")

require("./config/db").connectingTobDb()

const PORT = process.env.PORT
const app = express()


app.use(cookieParser(process.env.JWT_SECRET));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended : true}));
app.use(methodOverride('_method'));

app.set("view engine", "ejs")
app.set("views", "my_views")

app.get("/", (req, res) => {
    res.render('welcomePage')
})

app.get("/signup", (req, res) => {
    res.render('signup')
})

app.get("/login", (req, res)=> {
    res.render('login')
})

app.use("/auth", authRouter)
app.use("/blogs", articleRouter)

app.use((err, req, res, next) => {
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Your token has expired. Please log in again.' });
      } else if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: err.message || 'Invalid token' });
      } else {
        console.log("error occured")
        res.render('500', { message : 'Server error'})
    }
  
    next()
})

app.listen(PORT, () => {
    console.log(`Server hosted at: http://localhost:${PORT}`)
})

module.exports = app;
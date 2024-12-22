const express = require("express")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const authRouter = express.Router()
const authController = require("../controllers/authController")


authRouter.post("/signup", authController.signup);
            
authRouter.post("/login", authController.login)


module.exports = authRouter


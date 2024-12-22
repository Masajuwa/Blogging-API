const mongoose = require("mongoose")
require("dotenv").config

const MONGODB_URL = process.env.MONGODB_URL


function connectingTobDb () {
    mongoose.connect(MONGODB_URL)

    mongoose.connection.on("connected", ()=> {
        console.log("Connected to database successfully")
    })

    mongoose.connection.on("error", (error) => {
        console.log("error in connecting to database")
    })
}

module.exports = { connectingTobDb }
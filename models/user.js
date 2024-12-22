const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


const userModel = new mongoose.Schema({
    first_name : {
        type : String,
        required : true
    },
    last_name : {
        type : String,
        required : true
    },
    email : {
        type :  String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true
    }
})

userModel.pre(
    'save', 
    async function (next) {
        const user = this;

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(this.password, salt)
        this.password = hash;

        next();
    }
)

userModel.methods.isValidPassword = async function (password) {
     const user = this;
     const compare = await bcrypt.compare(password, user.password);
     return compare;
}


module.exports = mongoose.model("user", userModel)
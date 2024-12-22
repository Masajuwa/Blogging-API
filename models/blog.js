const mongoose = require("mongoose")

const Schema = mongoose.Schema

const articleModel = Schema({
    title : {
        type : String,
        required : true,
        unique : true
    },
    description : {
        type : String,
        required : true
    },
    body: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    state: {
        type: String,
        enum: ['draft', 'published'], 
        default: 'draft',
    },
    read_count: {
        type: Number,
        default: 0,
    },
    reading_time: {
        type: Number
    },
    tags: {
        type: [String],
    }
},
    { timestamps: true }
);

articleModel.pre(
    'save', 
    async function (next) {
        const article = this;
        const wordsPerMinute = 210;
        const bodyWords = this.body.split(' ').length;
        this.reading_time = Math.ceil(bodyWords / wordsPerMinute);

        next()
    }
)

module.exports = mongoose.model('Blog', articleModel)
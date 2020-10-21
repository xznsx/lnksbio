const mongoose = require('mongoose');

const linkSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    post: {
        type: String,
        required: true
    },
    clicks: {
        type: Number,
        required: true,
        default: 0
    }
});

module.exports = mongoose.model('Lnk', linkSchema);
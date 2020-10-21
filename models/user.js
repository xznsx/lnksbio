const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    displayname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    links: [{ name: String, value: String }],


    verified: {
        type: Boolean,
        required: true,
        default: false
    },
    verificationToken: String,

    
    resetPasswordToken: String,
    resetPasswordExpires: Number
});

module.exports = mongoose.model('User', userSchema);
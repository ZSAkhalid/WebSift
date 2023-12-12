const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userVerificationSchema = new Schema({
    userEmail: {
        type: String,
        required: true
    },
    OTP:{
        type: String,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    }
}, {timestamps: true});

// Create a model
module.exports = mongoose.model('OTP', userVerificationSchema);
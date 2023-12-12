const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        unique: false,
        min: 2,
        max: 35
    },
    lastName: {
        type: String,
        required: true,
        unique: false,
        min: 2,
        max: 35
    },
    email: {
        type: String,
        required: true,
        unique: true,
        min: 8,
        max: 32
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: false,
        min: 10,
        max: 10
    },
    password: {
        type: String,
        required: true,
        min: 8,
        max: 32
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    verified: {
        type: Boolean,
        required: true
    }
}, {timestamps: true});

// Create a model
module.exports = mongoose.model('User', userSchema);
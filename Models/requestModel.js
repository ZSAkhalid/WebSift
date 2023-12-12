const mongoose = require('mongoose')

const Schema = mongoose.Schema

const requestSchema = new Schema({
    userID: {
        type: String,
        required: true,
        unique: false
    },
    requestID: {
        type: String,
        required: true,
        unique: false
    },
    link: {
        type: String,
        required: true,
        unique: false
    },
    type: {
        type: String,
        required: true,
        unique: false,
        min: 5,
        max: 8
    },
    report: {
        type: String,
        required: true,
        unique: false
    },
    modifiedHTML: {
        type: String,
        required: false,
        unique: false
    },
    originalHTML: {
        type: String,
        required: false,
        unique: false
    },analysis_result:{
        type: String,
        required: false,
        unique: false
    }
}, {timestamps: true});

// Create a model
module.exports = mongoose.model('Request', requestSchema);
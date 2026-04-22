const mongoose = require("mongoose")

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 30,
        set: value => value.toUpperCase()
    },
    lastName: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 30,
        set: value => value.toUpperCase()
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        minlength: 10,
        maxlength: 60,
        trim: true,
        lowercase: true,
        default: null,
        required: true,
        match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    },
    type: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        maxlength: 500,
        trim: true,
        required: false
    },
}, { timestamps: true })

const Contact = mongoose.model("contact", ContactSchema)

module.exports = Contact
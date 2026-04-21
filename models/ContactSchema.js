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
    companyName: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
    contactRole: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 30,
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
    phone: {
        type: String,
        required: true
    },
    projectOption: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
    typeOfWork: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
    currentUrl: {
        type: String,
        required: false,   
        maxlength: 50,
    },
    description: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 500,
    },
    projectGoal: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
    budgetRange: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
    availableTime: {
        type: String,
        required: true,
        minlength: 3,      
        maxlength: 50,
    },
}, { timestamps: true })

const Contact = mongoose.model("contact", ContactSchema)

module.exports = Contact
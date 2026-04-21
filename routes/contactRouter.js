// Express y Router
const express = require("express")
const contactRouter = express.Router()
// Firebase
const auth = require("../config/firebase")
// Models
const Contact = require("../models/ContactSchema")

const esProduccion = (process.env.NODE_ENV === 'ppproduction');

contactRouter.post("/contact", async (req, res) => {
    const { name, lastName, companyName, contactRole, email, phone, projectOption, typeOfWork, currentUrl, description, projectGoal, budgetRange, availableTime } = req.body
    
    if(!name || !lastName || !companyName || !contactRole || !email || !phone || !projectOption || !typeOfWork || !description || !projectGoal || !budgetRange || !availableTime){
        return res.status(400).json({ message: "All required fields must be filled! 🔴" })
    }
    try {
        const form = { name, lastName, companyName, contactRole, email, phone, projectOption, typeOfWork, currentUrl, description, projectGoal, budgetRange, availableTime }
        await Contact.create(form)

        return res.status(201).json({ message: "Contact form submitted successfully! 🟢" })
    } catch (error) {
        console.error(esProduccion ? `Error creating new contact! 🔴` : `Error creating new contact! 🔴 ${error}`);
        res.status(500).send({ message: `Error creating new contact! 🔴` })
    }
})

module.exports = contactRouter
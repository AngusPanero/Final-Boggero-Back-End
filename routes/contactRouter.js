const express = require("express")
const contactRouter = express.Router()
const Contact = require("../models/ContactSchema")

// Create
contactRouter.post("/contact", async (req, res) => {
    const { name, lastName, phone, email, type, comment }  = req.body
    try {
        if(!name || !lastName || !phone || !email || !type) {
            return res.status(400).json({ message: `All fields are required! 🔴` })
        }
        const newContact = { name, lastName, phone, email, type, comment }

        await Contact.create(newContact)
        res.status(201).send({ message: `Contact created successfully! 🟢`, contact: newContact })
    } catch (error) {
        console.error(`Error creating new contact! 🔴 ${error}`);
        res.status(500).send({ message: `Error creating new contact! 🔴 ${error}` })
    }
})

// Read
contactRouter.get("/contacts", async (req, res) => {
    try {
        const contacts = await Contact.find()
        if(contacts.length === 0){
            return res.status(404).send({ message: `No contacts avaliable in DB! 🔴` })
        }
        res.status(200).send(contacts)
    } catch (error) {
        console.error(`Error reading contacts on DB! 🔴 ${error}`);
        res.status(500).send({ message: `Error reading contacts on DB! 🔴 ${error}` })
    }
})

// Delete
contactRouter.delete("/deletecontact/:id", async (req, res) => {
    const id = req.params.id
    try {
        const contact = await Contact.findByIdAndDelete(id)
        if(!contact){
            return res.status(404).send({ message: `No contact with ID: ${id} avaliable in DB! 🔴` })
        }
        res.status(200).send({ message: `Contact with ID: ${id} deleted successfully! 🟢` })
    } catch (error) {
        console.error(`Error deleting contact on DB! 🔴 ${error}`);
        res.status(500).send({ message: `Error deleting contact on DB! 🔴 ${error}` })
    }
})

module.exports = contactRouter
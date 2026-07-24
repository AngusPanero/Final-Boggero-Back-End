const express = require("express")
const adminMiddleware = require("../middleware/adminMiddleware")
const houseRouter = express.Router()
const House = require("../models/HouseSchema")

// Create
houseRouter.post("/createhouse", adminMiddleware, async (req, res) => {
    let { title, direction, operation, ubication, price, typeOfHouse, description, condition, ambients, bathrooms, years, taxes, covered, uncovered, area, imageUrl, maps, amenities, status } = req.body

    try {
        if (!title || !direction || !operation || !ubication || !price || !typeOfHouse || !description || !condition || !ambients || !bathrooms || !years || !taxes || !covered || !uncovered || !area || !imageUrl || !maps) {
            return res.status(404).send({ message: `All fields are required! 🔴` })
        }

        if (!Array.isArray(imageUrl)) {
            imageUrl = [imageUrl]
        }

        const createdHouse = {
            title, direction, operation, ubication, price,
            typeOfHouse, description, condition, ambients,
            bathrooms, years, taxes, covered, uncovered,
            area, imageUrl, maps,
            amenities: Array.isArray(amenities) ? amenities : [],
            status: status ?? "Disponible"
        }

        await House.create(createdHouse)
        res.status(201).send({ message: `New house created successfully! 🟢`, house: createdHouse })

    } catch (error) {
        console.error(`Error creating new house! 🔴 ${error}`)
        res.status(500).send({ message: `Error creating new house! 🔴 ${error}` })
    }
})

// Read
houseRouter.get("/houses", async (req, res) => {
    try {
        const houses = await House.find()
        if(houses.length === 0){
            return res.status(404).send({ message: `No houses avaliable in DB! 🔴` })
        }
        res.status(200).send(houses)
    } catch (error) {
        console.error(`Error reading houses on DB! 🔴 ${error}`);
        res.status(500).send({ message: `Error reading houses on DB! 🔴 ${error}` })
    }
})

// Read by ID
houseRouter.get("/house/:id", async (req, res) => {
    const id = req.params.id
    try {
        const houseId = await House.findById(id)
        if(!houseId){
            return res.status(404).send({ message: `No house with ID: ${id} avaliable in DB! 🔴` })
        }
        res.status(200).send(houseId)
    } catch (error) {
        console.error(`Error reding houses on DB! 🔴 ${error}`);
        res.status(500).send({ message: `Error reding houses on DB! 🔴 ${error}` })
    }
})

// Update
houseRouter.put("/update/:id", adminMiddleware, async (req, res) => {
    const id = req.params.id
    let { title, direction, operation, ubication, price, typeOfHouse, description, condition, ambients, bathrooms, years, taxes, covered, uncovered, area, maps, imageUrl, amenities, status } = req.body

    try {
        const house = await House.findById(id)
        if (!house) {
            return res.status(404).send({ message: `No house with ID: ${id} avaliable in DB! 🔴` })
        }

        const updatedHouse = {
            title:       title       ?? house.title,
            direction:   direction   ?? house.direction,
            operation:   operation   ?? house.operation,
            ubication:   ubication   ?? house.ubication,
            price:       price       ?? house.price,
            typeOfHouse: typeOfHouse ?? house.typeOfHouse,
            description: description ?? house.description,
            condition:   condition   ?? house.condition,
            ambients:    ambients    ?? house.ambients,
            bathrooms:   bathrooms   ?? house.bathrooms,
            years:       years       ?? house.years,
            taxes:       taxes       ?? house.taxes,
            covered:     covered     ?? house.covered,
            uncovered:   uncovered   ?? house.uncovered,
            area:        area        ?? house.area,
            maps:        maps        ?? house.maps,
            imageUrl:    Array.isArray(imageUrl) ? imageUrl : house.imageUrl,
            amenities:   Array.isArray(amenities) ? amenities : (house.amenities ?? []),
            status:      status      ?? house.status ?? "Disponible"
        }

        await House.findByIdAndUpdate(id, updatedHouse, { new: true })
        res.status(200).send({ message: `House updated successfully! 🟢`, house: updatedHouse })

    } catch (error) {
        console.error(`Error updating house! 🔴 ${error}`)
        res.status(500).send({ message: `Error updating house! 🔴 ${error}` })
    }
})

// Delete
houseRouter.delete("/delete/:id", adminMiddleware, async (req, res) => {
    const id = req.params.id
    try {
        const houseId = await House.findByIdAndDelete(id)
        if(!houseId){
            return res.status(404).send({ message: `No house with ID: ${id} to delete in DB! 🔴` })
        }
        res.status(200).send({ message: `House with ID: ${id} deleted successfully! 🟢`, house: houseId })
    } catch (error) {
        console.error(`Error deleting house with ID: ${id} on DB! 🔴 ${error}`);
        res.status(500).send({ message: `Error deleting house with ID: ${id} on DB! 🔴 ${error}` })
    }
})

module.exports = houseRouter
const mongoose = require("mongoose")

const HouseSchema = new mongoose.Schema ({
    title: {
        type: String,
        required: true
    },
    direction: {
        type: String,
        required: true
    },
    operation: {
        type: String,
        require: true
    },
    ubication: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    typeOfHouse: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        required: true
    },
    ambients: {
        type: String,
        required: true
    },
    bathrooms: {
        type: String,
        required: true
    },
    years: {
        type: String,
        required: true
    },
    taxes: {
        type: String,
        required: true
    },
    covered: {
        type: String,
        required: true
    },
    uncovered: {
        type: String,
        required: true
    },
    area: {
        type: String,
        required: true
    },
    imageUrl: {
        type: [String],
        required: true
    },
    maps: {
        type: String,
        required: true
    },
    amenities: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        default: "Disponible"
    }
}, { timestamps: true })

const House = mongoose.model("house", HouseSchema)

module.exports = House
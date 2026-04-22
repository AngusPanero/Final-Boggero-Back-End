const mongoose = require("mongoose")

const HouseSchema = new mongoose.Schema ({
    title: {// Principal
        type: String,
        required: true
    },
    direction: {// Principal
        type: String,
        required: true
    },
    operation: {//Principal
        type: String,
        require: true
    },
    ubication: {// Principal
        type: String,
        required: true
    },
    price: {// Principal
        type: String,
        required: true
    },
    typeOfHouse: {// Principal
        type: String,
        required: true
    },
    description: {// descripcion
        type: String,
        required: true
    },
    condition: { //Basico
        type: String,
        required: true
    },
    ambients: { //Basico
        type: String,
        required: true
    },
    bathrooms: { //Basico
        type: String,
        required: true
    },
    years: { //Basico
        type: String,
        required: true
    },
    taxes: { //Superficies y medidas
        type: String,
        required: true
    },
    covered: { //Superficies y medidas
        type: String,
        required: true
    },
    uncovered: { //Superficies y medidas
        type: String,
        required: true
    },
    area: { //Superficies y medidas
        type: String,
        required: true
    },
    imageUrl: {
        type: [String], // Si subo imágenes en string que eso esperaría si subo varias
        required: true
    },
    maps: {
        type: String,
        required: true
    }
}, { timestamps: true })

const House = mongoose.model("house", HouseSchema)

module.exports = House

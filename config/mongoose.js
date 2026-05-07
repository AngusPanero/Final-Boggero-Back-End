require("dotenv").config()
const mongoose = require("mongoose")

const esProduccion = (process.env.NODE_ENV === 'production');

const dbConnection = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log(`DB connected successfully! 🟢`);
        /* await mongoose.model('Product').collection.dropIndex('variantes.sku_variante_1');
        console.log("¡Regla vieja borrada con éxito!"); */
        
    } catch (error) {
        console.error(esProduccion ? `Error connecting DB! 🔴`: `Error connecting DB! 🔴 ${error}`);
        throw new Error(`Error connecting DB! 🔴`);
    }
}

module.exports = dbConnection
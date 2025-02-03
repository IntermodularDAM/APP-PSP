const mongoose = require('mongoose');

const habitacionSchema = new mongoose.Schema({
    _id: { type: String, unique: true, index: true },
    num_planta: { type: Number, required: true },
    nombre: {type: String, required: true},
    tipo: { type: String, required: true },
    capacidad: { type: String, required: true },
    descripcion: { type: String, required: true },
    opciones: {
        CamaExtra: { type: Boolean}, // Campo para Cama Extra
        Cuna: { type: Boolean}       // Campo para Cuna
    },
    precio_noche: { type: Number, required: true }, // Usamos el mismo nombre que en el backend
    precio_noche_original: { type: Number },         // Precio original (antes de oferta), opcional
    tieneOferta: { type: Boolean, default: false },
    estado: { type: Boolean, default: true }  ,
    imagenBase64: {type: String}      // Estado por defecto
}, { _id: false }); // No generar _id para cada documento individual, se usará el campo _id manualmente.


habitacionSchema.pre('save', async function (next) {
    const habitaciones = this;
    if (!habitaciones.isNew) return next();

    try {
        // Buscar habitaciones existentes para la misma planta
        const habitacionesEnPlanta = await this.constructor
            .find({ num_planta: habitaciones.num_planta })
            .exec();

        // Generar ID para la nueva habitación
        let newId = `H-${(habitaciones.num_planta * 100) + 1}`; // Valor predeterminado

        if (habitacionesEnPlanta.length > 0) {
            // Encontrar el número más alto de las habitaciones existentes
            const highestId = Math.max(
                ...habitacionesEnPlanta.map((habitacion) =>
                    parseInt(habitacion._id.split('-')[1], 10)
                )
            );

            // Incrementar el número secuencial más alto
            newId = `H-${highestId + 1}`;
        }

        // Asignar el nuevo ID
        habitaciones._id = newId;
        next();

    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Habitacion', habitacionSchema);

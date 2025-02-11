'use strict'

const mongoose = require('mongoose');

const EmpleadoSchema = new mongoose.Schema({
  
    _id: String,
    idUsuario: {type: String, ref: 'Usuario', require: true},
    nombre : { type: String, required: true },
    apellido : { type: String, required: true },
    dni : { type: String, required: true },
    rol : {type : String, default : "Empleado", immutable: true},
    date : { type: String, required: true },
    ciudad : { type: String, required: true },
    sexo : { type: String, required: true },
    registro:{type: Date, default: Date.now()},
    rutaFoto : { type: String, required: true },
    baja:{type :Date },

    puesto : String,
    salario : Number,
    
    
}, { _id: false }); //ID False para evitar advertencias de modificación de ID

// Pre-hook para generar un _id autoincrementable
EmpleadoSchema.pre('save', async function (next) {
    const empleado = this;
    if (!empleado.isNew) return next(); // Solo aplica a documentos nuevos

    try {
        // Busca el último documento ordenado por _id
        const lastUser = await this.constructor
        .findOne({})
        .sort({ _id: -1 })
        .exec();

        let newId = 'E-001'; // Valor por defecto si no hay documentos

        if (lastUser) {
            // Extrae la parte numérica del último _id
            const lastIdNumber = parseInt(lastUser._id.split('-')[1], 10);
            // Incrementa el número y genera el nuevo _id
            newId = `E-${String(lastIdNumber + 1).padStart(3, '0')}`;
        }

        empleado._id = newId; // Asigna el nuevo _id al documento
        next();
    } catch (error) {
        next(error);
    }
});



module.exports =  mongoose.model('Empleado', EmpleadoSchema, 'Empleado')
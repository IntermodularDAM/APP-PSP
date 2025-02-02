'use strict'

const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  
    _id: String,
    idUsuario: {type: String, ref: 'Usuario', require: true},
    nombre : { type: String, required: true },
    apellido : { type: String, required: true },
    dni : { type: String, required: true, unique: true },
    rol : {type : String, default : "Cliente", immutable: true},
    date : { type: String, required: true },
    ciudad : { type: String, required: true },
    sexo : { type: String, required: true },
    registro:{type: Date, default: Date.now()},
    rutaFoto : { type: String, required: true },
    baja:{type :Date },

    telefono : String,
    vip : Boolean, 
    
    
}, { _id: false }); //ID False para evitar advertencias de modificación de ID

// Pre-hook para generar un _id autoincrementable
ClienteSchema.pre('save', async function (next) {
    const cliente = this;
    if (!cliente.isNew) return next(); // Solo aplica a documentos nuevos

    try {
        // Busca el último documento ordenado por _id
        const lastUser = await mongoose
            .model('Cliente') // Usa el modelo actual registrado
            .findOne({})
            .sort({ _id: -1 })
            .exec();

        let newId = 'C-001'; // Valor por defecto si no hay documentos

        if (lastUser) {
            // Extrae la parte numérica del último _id
            const lastIdNumber = parseInt(lastUser._id.split('-')[1], 10);
            // Incrementa el número y genera el nuevo _id
            newId = `C-${String(lastIdNumber + 1).padStart(3, '0')}`;
        }

        cliente._id = newId; // Asigna el nuevo _id al documento
        next();
    } catch (error) {
        next(error);
    }
});


module.exports =  mongoose.model('Cliente', ClienteSchema, 'Cliente')
'use strict';

const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    _id: { type: String },
    idPerfil: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    registro: { type: Date, default: Date.now() },
    verificationCode: String, // Código de verificación
    codeExpiresAt: Date, // Fecha de expiración del código
    isVerified: { type: Boolean, default: false }, // Estado de verificación
}, { _id: false }); //ID False para evitar advertencias de modificación de ID

// Pre-hook para generar un _id autoincrementable
UsuarioSchema.pre('save', async function (next) {
    const usuario = this;
    if (!usuario.isNew) return next(); // Solo aplica a documentos nuevos

    try {
        // Busca el último documento ordenado por _id
        const lastUser = await mongoose
            .model('Usuario') // Usa el modelo actual registrado
            .findOne({})
            .sort({ _id: -1 })
            .exec();

        let newId = 'U-001'; // Valor por defecto si no hay documentos

        if (lastUser) {
            // Extrae la parte numérica del último _id
            const lastIdNumber = parseInt(lastUser._id.split('-')[1], 10);
            // Incrementa el número y genera el nuevo _id
            newId = `U-${String(lastIdNumber + 1).padStart(3, '0')}`;
        }

        usuario._id = newId; // Asigna el nuevo _id al documento
        next();
    } catch (error) {
        next(error);
    }
});

// Registrar correctamente el modelo sin espacios adicionales
module.exports = mongoose.model('Usuario', UsuarioSchema, 'Usuario');

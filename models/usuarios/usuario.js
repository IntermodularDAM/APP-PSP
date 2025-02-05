'use strict';

const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
    _id: { type: String },
    idPerfil: { type: String },
    email: { type: String, required: true },
    emailApp: { type: String, unique: true },
    password: { type: String,  required: true },// se establece la opción "select" como false, lo que significa que cuando se realice una consulta a la base de datos, este campo no se incluirá por defecto en los resultados.
    registro: { type: Date, default: Date.now() },
    verificationCode: String, // Código de verificación
    codeExpiresAt: Date, // Fecha de expiración del código
    isVerified: { type: Boolean, default: false }, // Estado de verificación
    privileges: { type: Boolean,default:null}, //Si ya realizo login por primera vez
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
        let emailSequence = '000'; // Secuencia inicial por defecto

        if (lastUser) {
            // Extrae la parte numérica del último _id
            const lastIdNumber = parseInt(lastUser._id.split('-')[1], 10);
            // Incrementa el número y genera el nuevo _id
            newId = `U-${String(lastIdNumber + 1).padStart(3, '0')}`;
            emailSequence = String(lastIdNumber + 1).padStart(3, '0'); // Reutiliza el número para la secuencia de email
        }

        usuario._id = newId; // Asigna el nuevo _id al documento
                
        usuario.emailApp = `mail_${emailSequence}@nightdays.es`;// Generar el emailApp usando la secuencia

        next();
    } catch (error) {
        next(error);
    }
});

// Registrar correctamente el modelo sin espacios adicionales
module.exports = mongoose.model('Usuario', UsuarioSchema, 'Usuario');

'use strict'

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);  // Plugin de mongoose para incrementar automáticamnte valores (ID´S)

const Usuario = new mongoose.Schema({
  
    _id: Number,
    email:String,
    password:String,
    registro:{type: Date, default: Date.now()},
    verificationCode: String, // Código de verificación
    codeExpiresAt: Date, // Fecha de expiración del código
    isVerified: { type: Boolean, default: false }, // Estado de verificación
    
})  


Usuario.plugin(AutoIncrement, { inc_field: '_id' ,id:'Usuario' });


module.exports =  mongoose.model('Usuario ', Usuario, 'Usuario')
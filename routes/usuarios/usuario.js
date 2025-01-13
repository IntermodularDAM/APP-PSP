const express = require('express');
const api = express.Router();
const usuarioController = require('../../controllers/usuarios/usuarioController')


api.post('/registroUsuario',usuarioController.registroUsuario);
api.post('/verificarUsuario',usuarioController.verificarUsuario);
api.post('/logIn',usuarioController.logIn);


module.exports = api;
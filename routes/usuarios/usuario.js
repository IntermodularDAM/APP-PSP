const express = require('express');
const api = express.Router();
const usuarioController = require('../../controllers/usuarios/usuarioController')


api.post(
    '/registroUsuario',
    usuarioController.registroUsuario
);
api.post(
    '/verificarUsuario'
    ,usuarioController.verificarUsuario
);
api.post(
    '/logIn',
    usuarioController.logIn
);

api.delete(
    '/eliminarUsuario',
    usuarioController.eliminarUsuario
);
api.get(
    '/todosLosUsuarios',
    usuarioController.todosLosUsuarios
);
api.post(
    '/emailDisponible'
    ,usuarioController.emailDisponible
);




module.exports = api;
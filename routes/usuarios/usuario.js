const express = require('express');
const api = express.Router();
const usuarioController = require('../../controllers/usuarios/usuarioController')
const auth = require("../../middlewares/auth");
const authz = require("../../middlewares/authz");

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
    auth,
    authz(["Administrador","Empleado"]),
    usuarioController.todosLosUsuarios
);
api.post(
    '/emailDisponible'
    ,usuarioController.emailDisponible
);




module.exports = api;
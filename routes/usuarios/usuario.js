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
    auth.isAuth,
    authz(["Administrador","Empleado"]),
    usuarioController.todosLosUsuarios
);
api.post(
    '/emailDisponible'
    ,usuarioController.emailDisponible
);
api.get(
    '/accessToken',
    auth.verifyToken,
);

api.post(
    '/recuperarPassword',
    usuarioController.recuperarPassword,
);

api.post(
    '/cambiarPassword',
    auth.isAuth,
    authz(['Administrador','Empleado','Cliente']),
    usuarioController.cambiarPassword
  );




module.exports = api;
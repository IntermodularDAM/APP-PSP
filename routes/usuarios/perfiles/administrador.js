const express = require('express');
const api = express.Router();
const administradorController = require('../../../controllers/usuarios/perfiles/administradorController')
const auth = require('../../../middlewares/auth')
const authz = require('../../../middlewares/authz');
const multer = require('multer')
const storageStrategy = multer.memoryStorage()
const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  storage:storageStrategy
});


// Solo los administradores pueden registrar administradores
api.post(
    '/registrarAdministrador',
    auth,
    authz(['Administrador']), 
    upload.single('picture'),
    administradorController.GuardarAdministrador
);

api.get(
  '/getAllAdministradores',
  auth,
  authz(['Administrador','Empleado']), 
  administradorController.AllAdministradores
);

api.get(
  '/editarAdministrador/:id',
  auth,
  authz(['Administrador','Empleado']), 
  administradorController.EditarAdministrador
);


// // Los empleados también pueden registrar clientes
// api.post(
//     '/registrarCliente',
//     auth,
//     authz(['administrador', 'empleado']),
//     upload.single('picture'),
//     administradorController.RegistrarCliente
// );


module.exports = api;
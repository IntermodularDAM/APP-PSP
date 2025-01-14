const express = require('express');
const api = express.Router();
const empleadoController = require('../../../controllers/usuarios/perfiles/empleadoController')
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


// Solo los administradores pueden registrar empleados
api.post(
    '/registrarEmpleado',
    auth,
    authz(['Administrador']), 
    upload.single('picture'),
    empleadoController.RegistrarEmpleado
);

api.get(
  '/getAllEmpleados',

  empleadoController.AllEmpleados
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
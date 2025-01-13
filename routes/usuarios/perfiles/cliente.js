const express = require('express');
const api = express.Router();
const clienteController = require('../../../controllers/usuarios/perfiles/clienteController')
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

//Los empleados también pueden registrar clientes
api.post(
    '/registrarCliente',
    auth,
    authz(['Administrador', 'Empleado']),
    upload.single('picture'),
    clienteController.RegistrarCliente
);


module.exports = api;
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
    upload.single('picture'),
    (req, res, next) => {
      console.log(req.body);  // 🚀 Verifica el cuerpo de la solicitud
      console.log(req.file);  // 🚀 Verifica el archivo recibido
      next();
  },

    clienteController.RegistrarCliente
);

api.get(
  '/getAllClientes',
  auth.isAuth,
  authz(['Administrador','Empleado']), 
  clienteController.AllClientes
);

api.put(
  '/editarCliente/:id',
  auth.isAuth,
  authz(['Administrador','Empleado']), 
  upload.single('picture'),
  clienteController.EditarCliente
);

api.delete(
  '/eliminarCliente',
  auth.isAuth,
  authz(['Administrador','Empleado','Cliente']), 
  clienteController.eliminarCliente
);

api.post(
  '/buscarCliente',
  auth.isAuth,
  authz(['Administrador','Empleado']), 
  upload.single('picture'),
  clienteController.BuscarCliente
);



module.exports = api;
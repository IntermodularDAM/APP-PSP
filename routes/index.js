'use strict'

const express = require('express');
const api = express.Router()

const rutasUsuarios = require('./usuarios/usuario');
const rutasAdministrador = require('./usuarios/perfiles/administrador');
const rutasEmpleado = require('./usuarios/perfiles/empleado');
const rutasClientes = require('./usuarios/perfiles/cliente');



api.use('/Usuario',rutasUsuarios);
api.use('/Administrador',rutasAdministrador);
api.use('/Empleado',rutasEmpleado);
api.use('/Cliente',rutasClientes);


module.exports = api
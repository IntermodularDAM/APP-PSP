'use strict'

const express = require('express');
const api = express.Router()

const rutasUsuarios = require('./usuarios/usuario');
const rutasAdministrador = require('./usuarios/perfiles/administrador');
const rutasEmpleado = require('./usuarios/perfiles/empleado');
const rutasClientes = require('./usuarios/perfiles/cliente');

const rutaReservas = require('./reservas/reservas');

const rutaHabitaciones = require('./habitaciones/habitaciones');


api.use('/Usuario',rutasUsuarios);
api.use('/Administrador',rutasAdministrador);
api.use('/Empleado',rutasEmpleado);
api.use('/Cliente',rutasClientes);

api.use('/Reserva',rutaReservas);

api.use('/Habitacion',rutaHabitaciones);

module.exports = api;
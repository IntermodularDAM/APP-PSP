const express = require('express');
const api = express.Router();
const auth = require('../../middlewares/auth')
const authz = require('../../middlewares/authz');
const reservaController = require('../../controllers/reservas/reservaController');

api.post(
    '/crearReserva',
    //auth,
    authz(['Administrador', 'Empleado']),
    reservaController.crearReserva
);
api.patch(
    '/modificarReserva',
    //auth,
    authz(['Administrador', 'Empleado']),
    reservaController.modificarReserva
);
api.delete(
    '/eliminarReserva',
    //auth,
    authz(['Administrador', 'Empleado']),
    reservaController.eliminarReserva
);
api.get(
    '/getAll',
    //auth,
    authz(['Administrador', 'Empleado']),
    reservaController.getAllReserva
)

module.exports = api;
